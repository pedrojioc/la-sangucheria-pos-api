import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderId } from '../../domain/purchase-order-id'
import { ReceivedItemInput } from '../../domain/purchase-order'
import { ReceptionUnitOfWork } from '../../domain/reception-unit-of-work'
import { PurchaseOrderItemReceivedEvent } from '../../domain/events/purchase-order-item-received.event'
import { IngredientRepository } from '@contexts/inventory/ingredient/domain/repositories/ingredient.repository'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { UnitConversionRepository } from '@contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { UnitConversionNotFound } from '@contexts/shared-kernel/unit-conversion/domain/exceptions/unit-conversion-not-found.exception'
import { NotFoundException } from '@shared/domain/exceptions/domain.exception'
import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryMovement } from '@contexts/inventory/stock-level/domain/inventory-movement'
import { InventoryLevel } from '@contexts/inventory/stock-level/domain/inventory-level'
import { MovementType } from '@contexts/inventory/stock-level/domain/movement-type'
import { Quantity } from '@shared/domain/value-objects/quantity'
import { Uuid } from '@shared/domain/value-objects/uuid'

/**
 * RegisterItemReception - Use Case
 *
 * Registra la recepción de items de una orden de compra y actualiza el inventario
 * de forma atómica en una única transacción DB vía ReceptionUnitOfWork.
 *
 * Todos los writes (purchase_order, inventory_batches, inventory_movements,
 * inventory_levels) ocurren en la misma transacción. Si cualquier paso falla,
 * todo hace rollback y el cliente recibe un error claro.
 *
 * Los eventos de dominio (PurchaseOrderClosed, etc.) se publican después del
 * commit para notificar a otros contextos (notificaciones, analytics).
 */
export class RegisterItemReception {
  constructor(
    private readonly uow: ReceptionUnitOfWork,
    private readonly ingredientRepository: IngredientRepository,
    private readonly unitConversionRepository: UnitConversionRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    purchaseOrderId: string,
    items: ReceivedItemInput[],
    notes: string | null,
    closeOrder: boolean = false,
    receivedBy: string | null = null
  ): Promise<void> {
    const allEvents: any[] = []

    await this.uow.commit(async uow => {
      const purchaseOrder = await uow.purchaseOrderRepository.findById(
        new PurchaseOrderId(purchaseOrderId)
      )

      if (!purchaseOrder) {
        throw new Error(`Purchase order ${purchaseOrderId} not found`)
      }

      // Separar items no recibidos y cancelarlos antes del batch de recepción
      const notReceivedItems = items.filter(i => i.notReceived)
      const receivedItems = items.filter(i => !i.notReceived)

      for (const item of notReceivedItems) {
        purchaseOrder.cancelItem(item.purchaseOrderItemId, item.notes)
      }

      if (receivedItems.length > 0) {
        purchaseOrder.registerBatchReception(receivedItems, notes, closeOrder, receivedBy)
      } else {
        // Solo hubo cancelaciones — evaluar cierre si closeOrder fue solicitado
        if (closeOrder) {
          purchaseOrder.close(receivedBy ?? 'system')
        }
      }

      await uow.purchaseOrderRepository.save(purchaseOrder)

      // Extraer los eventos — los PurchaseOrderItemReceivedEvent contienen todos
      // los datos necesarios para crear los batches en inventory
      const domainEvents = purchaseOrder.pullDomainEvents()

      const receptionEvents = domainEvents.filter(
        e => e instanceof PurchaseOrderItemReceivedEvent
      ) as PurchaseOrderItemReceivedEvent[]

      const otherEvents = domainEvents.filter(e => !(e instanceof PurchaseOrderItemReceivedEvent))

      // Crear batch + movement + level por cada item recibido, dentro de la misma transacción
      for (const event of receptionEvents) {
        const payload = event.toPrimitives()
        await this.registerInventoryForItem(uow, payload)
      }

      // Acumular eventos no-de-recepción para publicar después del commit
      allEvents.push(...otherEvents)
    })

    // Publicar eventos informativos después del commit (PurchaseOrderClosed, etc.)
    if (allEvents.length > 0) {
      await this.eventBus.publish(allEvents)
    }
  }

  private async registerInventoryForItem(
    uow: ReceptionUnitOfWork,
    payload: {
      ingredientId: string
      quantityReceived: number
      unitId: string
      unitCost: number
      currency: string
      supplierId: string
      orderNumber: string
      receivedDate: Date
    }
  ): Promise<void> {
    const ingredient = await this.ingredientRepository.search(
      new IngredientId(payload.ingredientId)
    )

    if (!ingredient) {
      throw new NotFoundException(`Ingredient with id '${payload.ingredientId}' not found`)
    }

    const baseUnitId = ingredient.toPrimitives().unitId

    let finalQuantity = payload.quantityReceived
    let finalUnitId = payload.unitId
    let finalUnitCost = payload.unitCost

    if (payload.unitId !== baseUnitId) {
      const converted = await this.convertToBaseUnit(
        payload.quantityReceived,
        payload.unitId,
        baseUnitId,
        payload.unitCost
      )
      finalQuantity = converted.convertedQuantity
      finalUnitId = converted.convertedUnitId
      finalUnitCost = converted.convertedUnitCost
    }

    const batchId = Uuid.random().value

    // 1. Batch
    const batch = InventoryBatch.create(
      batchId,
      payload.ingredientId,
      finalQuantity,
      finalUnitId,
      finalUnitCost,
      payload.currency,
      payload.receivedDate,
      null,
      payload.supplierId,
      payload.orderNumber
    )
    await uow.batchRepository.save(batch)

    // 2. Movement
    const movement = InventoryMovement.create(
      Uuid.random().value,
      payload.ingredientId,
      MovementType.PURCHASE,
      finalQuantity,
      finalUnitId,
      finalUnitCost,
      payload.currency,
      batchId,
      'Purchase registered',
      payload.orderNumber,
      null,
      payload.receivedDate
    )
    await uow.movementRepository.save(movement)

    // 3. Level
    const ingredientIdVO = new IngredientId(payload.ingredientId)
    let level = await uow.levelRepository.findByIngredient(ingredientIdVO)

    if (!level) {
      level = InventoryLevel.create(Uuid.random().value, payload.ingredientId, 0, finalUnitId)
    }

    level.increase(new Quantity(finalQuantity, finalUnitId))
    await uow.levelRepository.save(level)
  }

  private async convertToBaseUnit(
    quantity: number,
    fromUnitId: string,
    toUnitId: string,
    unitCost: number
  ): Promise<{ convertedQuantity: number; convertedUnitId: string; convertedUnitCost: number }> {
    const conversionRule = await this.unitConversionRepository.findByUnits(fromUnitId, toUnitId)

    if (!conversionRule) {
      throw new UnitConversionNotFound(fromUnitId, toUnitId)
    }

    const factor = conversionRule.getFactor().value

    return {
      convertedQuantity: quantity * factor,
      convertedUnitId: toUnitId,
      convertedUnitCost: unitCost / factor
    }
  }
}

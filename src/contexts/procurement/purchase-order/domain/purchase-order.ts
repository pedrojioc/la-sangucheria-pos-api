import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { Money } from '@/shared/domain/value-objects/money'
import { PurchaseOrderId } from './purchase-order-id'
import { PurchaseOrderNumber } from './purchase-order-number'
import { PurchaseOrderStatus, PurchaseOrderStatusTransitions } from './purchase-order-status'
import { PurchaseOrderItem, PurchaseOrderItemPrimitives } from './purchase-order-item'
import { InvalidStatusTransition } from './exceptions/invalid-status-transition.exception'
import { PurchaseOrderCannotBeModified } from './exceptions/purchase-order-cannot-be-modified.exception'
import { PurchaseOrderCannotBeClosed } from './exceptions/purchase-order-cannot-be-closed.exception'
import { PurchaseOrderHasNoItems } from './exceptions/purchase-order-has-no-items.exception'
import { PurchaseOrderCreatedEvent } from './events/purchase-order-created.event'
import { PurchaseOrderApprovedEvent } from './events/purchase-order-approved.event'
import { PurchaseOrderRejectedEvent } from './events/purchase-order-rejected.event'
import { PurchaseOrderItemReceivedEvent } from './events/purchase-order-item-received.event'
import { PurchaseOrderClosedEvent } from './events/purchase-order-closed.event'
import { PurchaseMethod } from './purchase-method'
import { SupplierId } from '../../supplier/domain/supplier-id'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'

/**
 * ReceivedItemInput - Input for batch reception
 *
 * Represents a single item being received in a batch reception operation.
 */
export interface ReceivedItemInput {
  purchaseOrderItemId: string
  quantityReceived: number
  quantityReceivedUnitId: string
  unitCost: number
  notes: string | null
}

/**
 * PurchaseOrderPrimitives - Primitives for Aggregate
 *
 * Representa los datos primitivos del agregado PurchaseOrder.
 *
 * IMPORTANTE: Este agregado NO contiene datos de otros agregados.
 * Solo contiene supplierId (referencia), NO supplierName.
 *
 * Para obtener supplierName y otros datos enriquecidos, usar
 * PurchaseOrderQueryService que devuelve Read Models.
 */
export interface PurchaseOrderPrimitives {
  id: string
  orderNumber: string
  supplierId: string
  // NOTE: supplierName, supplierEmail, etc. NO están aquí
  // Esos datos pertenecen al Read Model, no al agregado
  status: PurchaseOrderStatus
  items: PurchaseOrderItemPrimitives[]
  itemCount: number
  requestedBy: string
  approvedBy: string | null
  rejectedBy: string | null
  sentBy: string | null
  closedBy: string | null
  receivedBy: string | null
  purchaseMethod: PurchaseMethod | null
  purchaseMethodDetails: string | null
  totalAmount: number
  currency: string
  requestedDate: Date
  expectedDeliveryDate: Date | null
  approvedDate: Date | null
  sentDate: Date | null
  receivedDate: Date | null
  closedDate: Date | null
  notes: string | null
}

/**
 * PurchaseOrder - Aggregate Root
 *
 * Representa una orden de compra a un proveedor.
 * Es el agregado principal del Procurement Context.
 *
 * Ciclo de vida:
 * DRAFT → PENDING_APPROVAL → APPROVED → PARTIALLY_RECEIVED → CLOSED
 *                                ↓
 *                            REJECTED
 *                                ↓
 *                            CANCELLED
 *
 * Responsabilidades:
 * - Gestionar items de la orden
 * - Controlar transiciones de estado
 * - Calcular totales
 * - Registrar recepciones
 * - Emitir eventos de dominio
 *
 * Invariantes:
 * - Una orden debe tener al menos un item para ser aprobada
 * - Solo órdenes en DRAFT pueden modificarse
 * - Las transiciones de estado deben ser válidas
 * - El total debe coincidir con la suma de los items
 */
export class PurchaseOrder extends AggregateRoot {
  private constructor(
    private readonly id: PurchaseOrderId,
    private readonly orderNumber: PurchaseOrderNumber,
    private readonly supplierId: SupplierId,
    private status: PurchaseOrderStatus,
    private items: PurchaseOrderItem[],
    private itemCount: number,
    private readonly requestedBy: string, // TODO: Usar UserId cuando exista
    private approvedBy: string | null,
    private rejectedBy: string | null,
    private sentBy: string | null,
    private closedBy: string | null,
    private receivedBy: string | null,
    private purchaseMethod: PurchaseMethod | null,
    private purchaseMethodDetails: string | null,
    private readonly currency: string,
    private readonly requestedDate: Date,
    private expectedDeliveryDate: Date | null,
    private approvedDate: Date | null,
    private sentDate: Date | null,
    private receivedDate: Date | null,
    private closedDate: Date | null,
    private notes: string | null,
    private totalAmount?: Money
  ) {
    super()
  }

  /**
   * Crea una nueva orden de compra en estado DRAFT con items iniciales
   *
   * El agregado maneja la creación de los items internamente,
   * recibiendo primitivos desde la capa de aplicación.
   */
  static create(
    id: string,
    orderNumber: string,
    supplierId: string,
    requestedBy: string,
    currency: string,
    expectedDeliveryDate: Date | null,
    notes: string | null = null,
    items: PurchaseOrderItem[]
  ): PurchaseOrder {
    const now = new Date()

    const order = new PurchaseOrder(
      new PurchaseOrderId(id),
      new PurchaseOrderNumber(orderNumber),
      new SupplierId(supplierId),
      PurchaseOrderStatus.DRAFT,
      items,
      items.length, // itemCount
      requestedBy,
      null, // approvedBy
      null, // rejectedBy
      null, // sentBy
      null, // closedBy
      null, // receivedBy
      null, // purchaseMethod
      null, // purchaseMethodDetails
      currency,
      now, // requestedDate
      expectedDeliveryDate,
      null, // approvedDate
      null, // sentDate
      null, // receivedDate
      null, // closedDate
      notes
    )

    order.totalAmount = order.getTotalAmount()

    // Evento de dominio con información de items
    order.record(
      new PurchaseOrderCreatedEvent({
        purchaseOrderId: order.id.value,
        orderNumber: order.orderNumber.value,
        supplierId: order.supplierId.value,
        requestedBy: order.requestedBy,
        expectedDeliveryDate: order.expectedDeliveryDate,
        itemsCount: items.length,
        totalAmount: order.getTotalAmount().amount
      })
    )

    return order
  }
  static createOrderItems(
    items: Array<{
      id: string
      ingredientId: string
      ingredientName: string
      quantityRequested: number
      unitId: string
      unitCost: number
      currency: string
      notes: string | null
    }>
  ): PurchaseOrderItem[] {
    return items.map(item =>
      PurchaseOrderItem.create(
        item.id,
        item.ingredientId,
        item.ingredientName,
        item.quantityRequested,
        item.unitId,
        item.unitCost,
        item.currency,
        item.notes
      )
    )
  }

  // ===== Actualización de Orden =====

  /**
   * Actualiza los datos de la orden (solo en DRAFT)
   */
  update(supplierId?: string, expectedDeliveryDate?: Date | null, notes?: string | null): void {
    this.ensureCanBeModified()

    if (supplierId !== undefined) {
      ;(this as any).supplierId = new SupplierId(supplierId)
    }

    if (expectedDeliveryDate !== undefined) {
      this.expectedDeliveryDate = expectedDeliveryDate
    }

    if (notes !== undefined) {
      this.notes = notes
    }
  }

  // ===== Gestión de Items =====

  /**
   * Sincroniza los items de la orden con el estado deseado desde el frontend.
   *
   * Este método implementa un 3-way sync:
   * 1. Remueve items que ya no existen en el nuevo array
   * 2. Actualiza items existentes que cambiaron
   * 3. Prepara items nuevos para validación externa (NO los agrega aún)
   *
   * @returns Items a agregar y sus ingredientIds para validación externa
   */
  synchronizeItems(
    newItems: Array<{
      id: string
      ingredientId: string
      ingredientName: string
      quantityRequested: number
      unitId: string
      unitCost: number
      currency: string
      notes: string | null
    }>
  ): { itemsToAdd: PurchaseOrderItem[]; ingredientIdsToValidate: IngredientId[] } {
    this.ensureCanBeModified()

    const currentItemsMap = new Map(this.items.map(item => [item.id.value, item]))
    const currentItemIds = new Set(this.items.map(item => item.id.value))
    const newItemIds = new Set(newItems.map(item => item.id))

    // 1. Remover items que ya no existen en el nuevo array
    const itemIdsToRemove = Array.from(currentItemIds).filter(id => !newItemIds.has(id))
    for (const itemId of itemIdsToRemove) {
      this.items = this.items.filter(item => item.id.value !== itemId)
    }

    // 2. Actualizar items existentes que cambiaron
    for (const newItem of newItems) {
      if (!currentItemIds.has(newItem.id)) continue

      const currentItem = currentItemsMap.get(newItem.id)!
      if (this.hasItemChanged(currentItem, newItem)) {
        currentItem.update(
          newItem.quantityRequested,
          newItem.unitId,
          newItem.unitCost,
          newItem.currency,
          newItem.notes
        )
      }
    }

    // 3. Preparar items nuevos (requieren validación externa antes de agregar)
    const itemsToAddData = newItems.filter(item => !currentItemIds.has(item.id))
    const itemsToAdd = PurchaseOrder.createOrderItems(itemsToAddData)
    const ingredientIdsToValidate = itemsToAdd.map(item => item.ingredientId)

    this.itemCount = this.items.length
    this.recalculateTotalAmount()

    return { itemsToAdd, ingredientIdsToValidate }
  }

  /**
   * Confirma la adición de items después de validación externa.
   * Debe llamarse solo después de validar que los ingredientes existen.
   */
  confirmAddItems(items: PurchaseOrderItem[]): void {
    this.ensureCanBeModified()
    this.items.push(...items)
    this.itemCount = this.items.length
    this.recalculateTotalAmount()
  }

  /**
   * Verifica si un item cambió respecto a los nuevos datos
   */
  private hasItemChanged(
    currentItem: PurchaseOrderItem,
    newItem: {
      quantityRequested: number
      unitId: string
      unitCost: number
      currency: string
      notes: string | null
    }
  ): boolean {
    const primitives = currentItem.toPrimitives()
    return (
      primitives.quantityRequested !== newItem.quantityRequested ||
      primitives.quantityRequestedUnitId !== newItem.unitId ||
      primitives.unitCost !== newItem.unitCost ||
      primitives.currency !== newItem.currency ||
      primitives.notes !== newItem.notes
    )
  }

  /**
   * Agrega items a la orden (solo en DRAFT)
   * @deprecated Usar synchronizeItems + confirmAddItems para mejor control
   */
  addItems(items: PurchaseOrderItem[]): void {
    this.ensureCanBeModified()
    this.items.push(...items)
    this.itemCount = this.items.length
    this.recalculateTotalAmount()
  }

  /**
   * Actualiza un item existente en la orden (solo en DRAFT)
   * @deprecated Usar synchronizeItems para sincronización completa
   */
  updateItem(
    itemId: string,
    quantityRequested: number,
    unitId: string,
    unitCost: number,
    currency: string,
    notes: string | null
  ): void {
    this.ensureCanBeModified()

    const item = this.items.find(i => i.id.value === itemId)
    if (!item) {
      throw new Error(`Item ${itemId} not found in purchase order`)
    }

    item.update(quantityRequested, unitId, unitCost, currency, notes)
    this.recalculateTotalAmount()
  }

  /**
   * Remueve un item de la orden (solo en DRAFT)
   * @deprecated Usar synchronizeItems para sincronización completa
   */
  removeItem(itemId: string): void {
    this.ensureCanBeModified()
    this.items = this.items.filter(item => item.id.value !== itemId)
    this.itemCount = this.items.length
    this.recalculateTotalAmount()
  }

  /**
   * Obtiene el número de items de la orden
   */
  getItemCount(): number {
    return this.itemCount
  }

  // ===== Transiciones de Estado =====

  /**
   * Env�a la orden para aprobaci�n
   */
  submitForApproval(): void {
    this.ensureHasItems()
    this.transitionTo(PurchaseOrderStatus.PENDING_APPROVAL)
  }

  /**
   * Aprueba la orden
   */
  approve(approvedBy: string): void {
    this.transitionTo(PurchaseOrderStatus.APPROVED)
    this.approvedBy = approvedBy
    this.approvedDate = new Date()

    this.record(
      new PurchaseOrderApprovedEvent({
        purchaseOrderId: this.id.value,
        orderNumber: this.orderNumber.value,
        approvedBy: approvedBy,
        approvedDate: this.approvedDate,
        totalAmount: this.getTotalAmount().amount,
        currency: this.currency
      })
    )
  }

  /**
   * Rechaza la orden
   */
  reject(rejectedBy: string, reason: string | null = null): void {
    this.transitionTo(PurchaseOrderStatus.REJECTED)
    this.rejectedBy = rejectedBy
    if (reason) {
      this.notes = this.notes ? `${this.notes}\nRejection: ${reason}` : reason
    }

    this.record(
      new PurchaseOrderRejectedEvent({
        purchaseOrderId: this.id.value,
        orderNumber: this.orderNumber.value,
        rejectedBy: rejectedBy,
        reason: reason
      })
    )
  }

  /**
   * Registra la recepción de un item
   *
   * Al recibir todos los items, la orden pasa automáticamente a CLOSED.
   * Si solo se reciben algunos items, pasa a PARTIALLY_RECEIVED.
   *
   * @deprecated Use registerBatchReception for batch processing
   */
  registerItemReception(itemId: string, quantityReceived: number, unitId: string): void {
    const item = this.items.find(i => i.id.value === itemId)
    if (!item) {
      throw new Error(`Item ${itemId} not found in purchase order`)
    }

    item.registerReception(quantityReceived, unitId)

    const now = new Date()

    // Actualizar estado de la orden
    if (this.areAllItemsProcessed()) {
      // Al recibir todo, va directo a CLOSED (no pasa por RECEIVED)
      this.transitionTo(PurchaseOrderStatus.CLOSED)
      this.receivedDate = now
      this.closedDate = now

      // Emitir evento de cierre
      this.record(
        new PurchaseOrderClosedEvent({
          purchaseOrderId: this.id.value,
          orderNumber: this.orderNumber.value,
          closedBy: null, // Se cierra automáticamente al recibir todo
          closedDate: this.closedDate,
          totalAmount: this.getTotalAmount().amount,
          currency: this.currency,
          itemsReceived: this.items.length
        })
      )
    } else if (this.status === PurchaseOrderStatus.APPROVED) {
      // Primera recepción parcial desde APPROVED
      this.transitionTo(PurchaseOrderStatus.PARTIALLY_RECEIVED)
      this.receivedDate = now
    }
    // Si ya está en PARTIALLY_RECEIVED, se mantiene hasta recibir todo

    const itemData = item.toPrimitives()
    // Emitir evento para que Inventory reaccione
    this.record(
      new PurchaseOrderItemReceivedEvent({
        purchaseOrderId: this.id.value,
        orderNumber: this.orderNumber.value,
        itemId: itemData.id,
        ingredientId: itemData.ingredientId,
        quantityReceived: quantityReceived,
        unitId: unitId,
        unitCost: itemData.unitCost,
        currency: itemData.currency,
        supplierId: this.supplierId.value,
        receivedDate: now,
        occurredOn: now
      })
    )
  }

  /**
   * Registra la recepción de múltiples items en una sola operación
   *
   * Cierre automático: Si tras la recepción TODOS los items tienen su cantidad
   * completa (quantityReceived >= quantityRequested), la orden se cierra automáticamente.
   *
   * Cierre manual (closeOrder=true): Si no se completaron todas las cantidades pero
   * todos los items fueron procesados (recibidos parcialmente o cancelados), el usuario
   * puede solicitar el cierre. Si hay items sin procesar, se lanza una excepción.
   *
   * @param receivedItems - Array de items recibidos con sus cantidades y costos reales
   * @param receptionNotes - Notas generales de la recepción (opcional)
   * @param closeOrder - Si true, cierra la orden manualmente (requiere todos los items procesados)
   */
  registerBatchReception(
    receivedItems: ReceivedItemInput[],
    receptionNotes: string | null,
    closeOrder: boolean = false,
    receivedBy: string | null = null
  ): void {
    if (receivedItems.length === 0) {
      throw new Error('At least one item must be provided for reception')
    }

    const now = new Date()

    // Procesar cada item recibido
    for (const receivedItem of receivedItems) {
      const item = this.items.find(i => i.id.value === receivedItem.purchaseOrderItemId)
      if (!item) {
        throw new Error(`Item ${receivedItem.purchaseOrderItemId} not found in purchase order`)
      }

      // Registrar recepción con costo actualizado
      item.registerReception(
        receivedItem.quantityReceived,
        receivedItem.quantityReceivedUnitId,
        receivedItem.unitCost,
        receivedItem.notes
      )

      const itemData = item.toPrimitives()

      // Emitir evento para que Inventory reaccione (uno por cada item)
      this.record(
        new PurchaseOrderItemReceivedEvent({
          purchaseOrderId: this.id.value,
          orderNumber: this.orderNumber.value,
          itemId: itemData.id,
          ingredientId: itemData.ingredientId,
          quantityReceived: receivedItem.quantityReceived,
          unitId: receivedItem.quantityReceivedUnitId,
          unitCost: receivedItem.unitCost,
          currency: itemData.currency,
          supplierId: this.supplierId.value,
          receivedDate: now,
          occurredOn: now
        })
      )
    }

    // Agregar notas de recepción si se proporcionan
    if (receptionNotes) {
      this.notes = this.notes ? `${this.notes}\nReception: ${receptionNotes}` : receptionNotes
    }

    // Recalcular el monto total con los nuevos costos
    this.recalculateTotalAmount()

    // Actualizar receivedDate y receivedBy si es la primera recepción
    if (!this.receivedDate) {
      this.receivedDate = now
      this.receivedBy = receivedBy
    }

    // Determinar transición de estado
    const shouldAutoClose = this.areAllItemsFullyReceived()

    if (shouldAutoClose) {
      // Cierre automático: todos los items recibidos con cantidad completa
      this.transitionTo(PurchaseOrderStatus.CLOSED)
      this.closedDate = now

      this.record(
        new PurchaseOrderClosedEvent({
          purchaseOrderId: this.id.value,
          orderNumber: this.orderNumber.value,
          closedBy: null,
          closedDate: this.closedDate,
          totalAmount: this.getTotalAmount().amount,
          currency: this.currency,
          itemsReceived: this.items.filter(i => i.hasBeenReceived()).length
        })
      )
    } else if (closeOrder) {
      // Cierre manual: el usuario solicita cerrar aunque no se completaron todas las cantidades
      const pendingItems = this.items.filter(item => !item.hasBeenProcessed())
      if (pendingItems.length > 0) {
        throw new PurchaseOrderCannotBeClosed(pendingItems.length)
      }

      this.transitionTo(PurchaseOrderStatus.CLOSED)
      this.closedDate = now

      this.record(
        new PurchaseOrderClosedEvent({
          purchaseOrderId: this.id.value,
          orderNumber: this.orderNumber.value,
          closedBy: null,
          closedDate: this.closedDate,
          totalAmount: this.getTotalAmount().amount,
          currency: this.currency,
          itemsReceived: this.items.filter(i => i.hasBeenReceived()).length
        })
      )
    } else if (this.status === PurchaseOrderStatus.APPROVED) {
      // Primera recepción parcial
      this.transitionTo(PurchaseOrderStatus.PARTIALLY_RECEIVED)
    }
    // Si ya está en PARTIALLY_RECEIVED y no se cierra, se mantiene
  }

  /**
   * Cancela items específicos de la orden (proveedor no pudo conseguirlos)
   *
   * Los items cancelados se marcan como procesados y no afectan el inventario.
   * La orden NO se cierra automáticamente al cancelar items. El usuario debe
   * cerrar explícitamente la orden mediante el endpoint de recepción con
   * closeOrder=true o el endpoint de cierre manual.
   *
   * @param itemIds - IDs de los items a cancelar
   * @param reason - Razón de la cancelación (ej: "No disponible con proveedor")
   */
  cancelItems(itemIds: string[], reason: string | null): void {
    if (itemIds.length === 0) {
      throw new Error('At least one item must be provided for cancellation')
    }

    for (const itemId of itemIds) {
      const item = this.items.find(i => i.id.value === itemId)
      if (!item) {
        throw new Error(`Item ${itemId} not found in purchase order`)
      }

      item.cancel(reason)
    }

    const now = new Date()

    // Transición de estado si es necesario (sin cerrar automáticamente)
    if (this.status === PurchaseOrderStatus.APPROVED) {
      // Si hay items cancelados, pasa a parcial
      this.transitionTo(PurchaseOrderStatus.PARTIALLY_RECEIVED)
      if (!this.receivedDate) {
        this.receivedDate = now
      }
    }
    // Si ya está en PARTIALLY_RECEIVED, se mantiene hasta que el usuario cierre
  }

  /**
   * Cierra la orden (estado final)
   */
  close(closedBy: string): void {
    this.transitionTo(PurchaseOrderStatus.CLOSED)
    this.closedBy = closedBy
    this.closedDate = new Date()

    this.record(
      new PurchaseOrderClosedEvent({
        purchaseOrderId: this.id.value,
        orderNumber: this.orderNumber.value,
        closedBy: closedBy,
        closedDate: this.closedDate,
        totalAmount: this.getTotalAmount().amount,
        currency: this.currency,
        itemsReceived: this.items.length
      })
    )
  }

  // ===== Cálculos =====

  /**
   * Calcula el monto total de la orden
   */
  private getTotalAmount(): Money {
    const total = this.items.reduce((sum, item) => sum + item.totalCost.amount, 0)
    return new Money(total, this.currency)
  }

  /**
   * Recalcula y actualiza el monto total de la orden
   * Debe llamarse después de cualquier modificación a los items
   */
  private recalculateTotalAmount(): void {
    this.totalAmount = this.getTotalAmount()
  }

  /**
   * Verifica si todos los items han sido procesados (recibidos o cancelados)
   * Una orden está completa cuando todos sus items han sido procesados,
   * independientemente de si fueron recibidos con cantidad parcial o cancelados.
   */
  private areAllItemsProcessed(): boolean {
    return this.items.every(item => item.hasBeenProcessed())
  }

  /**
   * Verifica si todos los items han sido completamente recibidos
   * (cantidad recibida >= cantidad solicitada para cada item)
   */
  private areAllItemsFullyReceived(): boolean {
    return this.items.every(item => item.isFullyReceived())
  }

  // ===== Validaciones =====

  private ensureCanBeModified(): void {
    if (!PurchaseOrderStatusTransitions.canBeEdited(this.status)) {
      throw new PurchaseOrderCannotBeModified(this.status)
    }
  }

  private ensureHasItems(): void {
    if (this.items.length === 0) {
      throw new PurchaseOrderHasNoItems()
    }
  }

  private transitionTo(newStatus: PurchaseOrderStatus): void {
    if (!PurchaseOrderStatusTransitions.canTransition(this.status, newStatus)) {
      throw new InvalidStatusTransition(this.status, newStatus)
    }
    this.status = newStatus
  }

  // ===== Serialización =====

  toPrimitives(): PurchaseOrderPrimitives {
    return {
      id: this.id.value,
      orderNumber: this.orderNumber.value,
      supplierId: this.supplierId.value,
      status: this.status,
      items: this.items.map(item => item.toPrimitives()),
      itemCount: this.itemCount,
      requestedBy: this.requestedBy,
      approvedBy: this.approvedBy,
      rejectedBy: this.rejectedBy,
      sentBy: this.sentBy,
      closedBy: this.closedBy,
      receivedBy: this.receivedBy,
      purchaseMethod: this.purchaseMethod,
      purchaseMethodDetails: this.purchaseMethodDetails,
      totalAmount: this.totalAmount?.amount || 0,
      currency: this.currency,
      requestedDate: this.requestedDate,
      expectedDeliveryDate: this.expectedDeliveryDate,
      approvedDate: this.approvedDate,
      sentDate: this.sentDate,
      receivedDate: this.receivedDate,
      closedDate: this.closedDate,
      notes: this.notes
    }
  }

  static fromPrimitives(primitives: PurchaseOrderPrimitives): PurchaseOrder {
    const order = new PurchaseOrder(
      new PurchaseOrderId(primitives.id),
      new PurchaseOrderNumber(primitives.orderNumber),
      new SupplierId(primitives.supplierId),
      primitives.status,
      primitives.items.map(item => PurchaseOrderItem.fromPrimitives(item)),
      primitives.itemCount,
      primitives.requestedBy,
      primitives.approvedBy,
      primitives.rejectedBy,
      primitives.sentBy,
      primitives.closedBy,
      primitives.receivedBy,
      primitives.purchaseMethod,
      primitives.purchaseMethodDetails,
      primitives.currency,
      primitives.requestedDate,
      primitives.expectedDeliveryDate,
      primitives.approvedDate,
      primitives.sentDate,
      primitives.receivedDate,
      primitives.closedDate,
      primitives.notes,
      new Money(primitives.totalAmount, primitives.currency)
    )

    return order
  }
}

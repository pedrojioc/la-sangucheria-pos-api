import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PurchaseOrderEntity } from './purchase-order.entity'
import { PurchaseOrderRepository } from '../../../domain/repositories/purchase-order.repository'
import { PurchaseOrder, PurchaseOrderPrimitives } from '../../../domain/purchase-order'
import { PurchaseOrderId } from '../../../domain/purchase-order-id'
import { PurchaseOrderStatus } from '../../../domain/purchase-order-status'
import { PurchaseOrderItemEntity } from './purchase-order-item.entity'

/**
 * TypeOrmPurchaseOrderRepository - Infrastructure Implementation (WRITE Operations)
 *
 * Implementación de persistencia usando TypeORM para Purchase Orders.
 * Este repositorio se enfoca en operaciones de ESCRITURA y búsquedas
 * necesarias para comandos.
 *
 * Para operaciones de LECTURA complejas (listados con paginación, filtros,
 * búsqueda por supplierName), usar TypeOrmPurchaseOrderQueryService.
 *
 * Responsabilidades:
 * - Guardar órdenes de compra con sus items
 * - Recuperar órdenes por ID o orderNumber (para comandos)
 * - Buscar órdenes por estado (para procesos batch)
 * - Manejar la relación OneToMany con items
 * - Generar números de secuencia para orderNumber
 */
@Injectable()
export class TypeOrmPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly repository: Repository<PurchaseOrderEntity>,
    @InjectRepository(PurchaseOrderItemEntity)
    private readonly itemRepository: Repository<PurchaseOrderItemEntity>
  ) {}

  async save(purchaseOrder: PurchaseOrder): Promise<void> {
    const primitives = purchaseOrder.toPrimitives()

    // 1. Guardar entidad principal
    const entity = this.repository.create({
      id: primitives.id,
      orderNumber: primitives.orderNumber,
      supplierId: primitives.supplierId,
      status: primitives.status,
      requestedBy: primitives.requestedBy,
      approvedBy: primitives.approvedBy,
      rejectedBy: primitives.rejectedBy,
      sentBy: primitives.sentBy,
      receivedBy: primitives.receivedBy,
      closedBy: primitives.closedBy,
      purchaseMethod: primitives.purchaseMethod,
      purchaseMethodDetails: primitives.purchaseMethodDetails,
      totalAmount: primitives.totalAmount,
      currency: primitives.currency,
      requestedDate: primitives.requestedDate,
      expectedDeliveryDate: primitives.expectedDeliveryDate,
      approvedDate: primitives.approvedDate,
      sentDate: primitives.sentDate,
      receivedDate: primitives.receivedDate,
      closedDate: primitives.closedDate,
      notes: primitives.notes,
      itemCount: primitives.itemCount
    })

    await this.repository.save(entity)

    // 2. Eliminar items huérfanos (que ya no están en el dominio)
    const currentItemIds = primitives.items.map(i => i.id)
    await this.deleteOrphanedItems(primitives.id, currentItemIds)

    // 3. Upsert items actuales
    if (primitives.items.length > 0) {
      const items = primitives.items.map(itemPrimitives =>
        this.itemRepository.create({
          id: itemPrimitives.id,
          purchaseOrderId: primitives.id,
          ingredientId: itemPrimitives.ingredientId,
          quantityRequested: itemPrimitives.quantityRequested,
          quantityRequestedUnitId: itemPrimitives.quantityRequestedUnitId,
          quantityReceived: itemPrimitives.quantityReceived,
          quantityReceivedUnitId: itemPrimitives.quantityReceivedUnitId,
          unitCost: itemPrimitives.unitCost,
          totalCost: itemPrimitives.totalCost,
          currency: itemPrimitives.currency,
          notes: itemPrimitives.notes,
          isCancelled: itemPrimitives.isCancelled,
          cancellationReason: itemPrimitives.cancellationReason
        })
      )
      await this.itemRepository.save(items)
    }
  }

  /**
   * Elimina items que ya no pertenecen a la orden (fueron removidos del dominio)
   */
  private async deleteOrphanedItems(
    purchaseOrderId: string,
    currentItemIds: string[]
  ): Promise<void> {
    if (currentItemIds.length === 0) {
      // Si no hay items, eliminar todos los de esta orden
      await this.itemRepository
        .createQueryBuilder()
        .delete()
        .where('purchase_order_id = :purchaseOrderId', { purchaseOrderId })
        .execute()
    } else {
      // Eliminar solo los que no están en la lista actual
      await this.itemRepository
        .createQueryBuilder()
        .delete()
        .where('purchase_order_id = :purchaseOrderId', { purchaseOrderId })
        .andWhere('id NOT IN (:...currentItemIds)', { currentItemIds })
        .execute()
    }
  }

  /**
   * Busca una orden por su ID (para comandos que necesitan el agregado)
   * Carga items con datos de ingredientes para lógica de negocio
   */
  async findById(id: PurchaseOrderId): Promise<PurchaseOrder | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value },
      relations: {
        items: {
          ingredient: true,
          quantityRequestedUnit: true,
          quantityReceivedUnit: true
        }
      }
    })

    if (!entity) {
      return null
    }

    return this.toDomain(entity)
  }

  /**
   * Busca una orden por su número (para validación de unicidad)
   */
  async findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null> {
    const entity = await this.repository.findOne({
      where: { orderNumber },
      relations: {
        items: {
          ingredient: true,
          quantityRequestedUnit: true,
          quantityReceivedUnit: true
        }
      }
    })

    if (!entity) {
      return null
    }

    return this.toDomain(entity)
  }

  /**
   * Busca órdenes por estado (para procesos batch/background)
   */
  async findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    const entities = await this.repository.find({
      where: { status },
      relations: {
        items: {
          ingredient: true,
          quantityRequestedUnit: true,
          quantityReceivedUnit: true
        }
      },
      order: { requestedDate: 'DESC' }
    })

    return entities.map(entity => this.toDomain(entity))
  }

  /**
   * Obtiene el siguiente número de secuencia para generar orderNumber
   * Implementación simple: cuenta órdenes + 1
   */
  async getNextSequenceNumber(): Promise<number> {
    const count = await this.repository.count()
    return count + 1
  }

  /**
   * Convierte una entidad TypeORM a objeto de dominio
   *
   * IMPORTANTE: El agregado NO contiene datos de otros agregados.
   * Solo incluye supplierId, NO supplierName.
   * Para datos enriquecidos, usar PurchaseOrderQueryService.
   */
  private toDomain(entity: PurchaseOrderEntity): PurchaseOrder {
    const primitives: PurchaseOrderPrimitives = {
      id: entity.id,
      orderNumber: entity.orderNumber,
      supplierId: entity.supplierId,
      // NOTE: No supplierName here - that belongs to Read Models
      status: entity.status as PurchaseOrderStatus,
      items: (entity.items ?? []).map(item => ({
        id: item.id,
        ingredientId: item.ingredientId,
        ingredientName: item.ingredient?.name ?? '',
        quantityRequested: Number(item.quantityRequested),
        quantityRequestedUnitId: item.quantityRequestedUnitId,
        quantityReceived: item.quantityReceived ? Number(item.quantityReceived) : null,
        quantityReceivedUnitId: item.quantityReceivedUnitId,
        unitCost: Number(item.unitCost),
        currency: item.currency,
        totalCost: Number(item.totalCost),
        notes: item.notes,
        isCancelled: item.isCancelled,
        cancellationReason: item.cancellationReason
      })),
      itemCount: entity.itemCount,
      requestedBy: entity.requestedBy,
      approvedBy: entity.approvedBy,
      rejectedBy: entity.rejectedBy,
      sentBy: entity.sentBy,
      receivedBy: entity.receivedBy,
      closedBy: entity.closedBy,
      purchaseMethod: entity.purchaseMethod,
      purchaseMethodDetails: entity.purchaseMethodDetails,
      totalAmount: Number(entity.totalAmount),
      currency: entity.currency,
      requestedDate: entity.requestedDate,
      expectedDeliveryDate: entity.expectedDeliveryDate,
      approvedDate: entity.approvedDate,
      sentDate: entity.sentDate,
      receivedDate: entity.receivedDate,
      closedDate: entity.closedDate,
      notes: entity.notes
    }

    return PurchaseOrder.fromPrimitives(primitives)
  }
}

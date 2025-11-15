import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PurchaseOrderEntity } from './purchase-order.entity'
import { PurchaseOrderItemEntity } from './purchase-order-item.entity'
import { PurchaseOrderRepository } from '../../../domain/repositories/purchase-order.repository'
import { PurchaseOrder, PurchaseOrderPrimitives } from '../../../domain/purchase-order'
import { PurchaseOrderId } from '../../../domain/purchase-order-id'
import { PurchaseOrderStatus } from '../../../domain/purchase-order-status'

/**
 * TypeOrmPurchaseOrderRepository
 *
 * Implementación de persistencia usando TypeORM para Purchase Orders.
 *
 * Responsabilidades:
 * - Guardar órdenes de compra con sus items
 * - Recuperar órdenes por diferentes criterios
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

    // Crear entidad principal
    const entity = this.repository.create({
      id: primitives.id,
      orderNumber: primitives.orderNumber,
      supplierId: primitives.supplierId,
      status: primitives.status,
      requestedBy: primitives.requestedBy,
      approvedBy: primitives.approvedBy,
      rejectedBy: primitives.rejectedBy,
      sentBy: primitives.sentBy,
      closedBy: primitives.closedBy,
      totalAmount: primitives.totalAmount,
      currency: primitives.currency,
      requestedDate: primitives.requestedDate,
      expectedDeliveryDate: primitives.expectedDeliveryDate,
      approvedDate: primitives.approvedDate,
      sentDate: primitives.sentDate,
      receivedDate: primitives.receivedDate,
      closedDate: primitives.closedDate,
      notes: primitives.notes
    })

    // Crear items asociados
    entity.items = primitives.items.map(itemPrimitives =>
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
        notes: itemPrimitives.notes
      })
    )

    // Guardar con cascade
    await this.repository.save(entity)
  }

  async findById(id: PurchaseOrderId): Promise<PurchaseOrder | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value },
      relations: ['items']
    })

    if (!entity) {
      return null
    }

    return this.toDomain(entity)
  }

  async findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null> {
    const entity = await this.repository.findOne({
      where: { orderNumber },
      relations: ['items']
    })

    if (!entity) {
      return null
    }

    return this.toDomain(entity)
  }

  async findBySupplierId(supplierId: string): Promise<PurchaseOrder[]> {
    const entities = await this.repository.find({
      where: { supplierId },
      relations: ['items'],
      order: { requestedDate: 'DESC' }
    })

    return entities.map(entity => this.toDomain(entity))
  }

  async findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
    const entities = await this.repository.find({
      where: { status },
      relations: ['items'],
      order: { requestedDate: 'DESC' }
    })

    return entities.map(entity => this.toDomain(entity))
  }

  async findAll(): Promise<PurchaseOrder[]> {
    const entities = await this.repository.find({
      relations: ['items'],
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
   */
  private toDomain(entity: PurchaseOrderEntity): PurchaseOrder {
    const primitives: PurchaseOrderPrimitives = {
      id: entity.id,
      orderNumber: entity.orderNumber,
      supplierId: entity.supplierId,
      status: entity.status as PurchaseOrderStatus,
      items: entity.items.map(item => ({
        id: item.id,
        ingredientId: item.ingredientId,
        quantityRequested: Number(item.quantityRequested),
        quantityRequestedUnitId: item.quantityRequestedUnitId,
        quantityReceived: item.quantityReceived ? Number(item.quantityReceived) : null,
        quantityReceivedUnitId: item.quantityReceivedUnitId,
        unitCost: Number(item.unitCost),
        currency: item.currency,
        totalCost: Number(item.totalCost),
        notes: item.notes
      })),
      requestedBy: entity.requestedBy,
      approvedBy: entity.approvedBy,
      rejectedBy: entity.rejectedBy,
      sentBy: entity.sentBy,
      closedBy: entity.closedBy,
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

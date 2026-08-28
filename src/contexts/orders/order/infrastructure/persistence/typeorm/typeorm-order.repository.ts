import { Injectable } from '@nestjs/common'
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'

import { Order } from '@contexts/orders/order/domain/order'
import { OrderId } from '@contexts/orders/order/domain/order-id'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderRepository } from '@contexts/orders/order/domain/repositories/order.repository'
import { OrderItemsNotLoaded } from '@contexts/orders/order/domain/exceptions/order-items-not-loaded.exception'
import { OrderEntity } from './order.entity'
import { OrderItemEntity } from './order-item.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmOrderRepository
  extends TransactionalRepository<OrderEntity>
  implements OrderRepository
{
  constructor(
    @InjectRepository(OrderEntity)
    repository: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly itemRepository: Repository<OrderItemEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  /**
   * Per design D2: composes with the ambient UnitOfWork transaction instead
   * of opening its own — uses `this.manager`, which resolves to the ambient
   * EntityManager when a TransactionInterceptor-scoped request is active, or
   * falls back to the default (non-transactional) manager otherwise. This is
   * DIFFERENT from nextOrderNumber() below, which is a sequence allocator
   * that deliberately keeps its own independent dataSource.transaction() and
   * must NOT join the ambient transaction (see that method's doc comment).
   */
  async save(order: Order): Promise<void> {
    const p = order.toPrimitives()
    const manager = this.manager

    await manager.save(OrderEntity, {
      id: p.id,
      orderNumber: p.orderNumber,
      type: p.type,
      status: p.status,
      tableId: p.tableId,
      customerId: p.customerId,
      addressId: p.addressId,
      deliveryFee: p.deliveryFee,
      currency: p.currency,
      kitchenTickets: p.kitchenTickets,
      payments: p.payments,
      splits: p.splits,
      taxConfig: p.taxConfig,
      orderDiscount: p.orderDiscount,
      subtotal: p.subtotal,
      discountTotal: p.discountTotal,
      taxBase: p.taxBase,
      taxAmount: p.taxAmount,
      total: p.total,
      tip: p.tip,
      notes: p.notes,
      openedBy: p.openedBy,
      openedAt: p.openedAt,
      closedBy: p.closedBy,
      closedAt: p.closedAt,
      cancelledBy: p.cancelledBy,
      cancelledAt: p.cancelledAt,
      cancelledReason: p.cancelledReason
    })

    const currentItemIds = p.items.map(item => item.id)

    if (currentItemIds.length === 0) {
      await manager
        .createQueryBuilder()
        .delete()
        .from(OrderItemEntity)
        .where('order_id = :orderId', { orderId: p.id })
        .execute()
    } else {
      await manager
        .createQueryBuilder()
        .delete()
        .from(OrderItemEntity)
        .where('order_id = :orderId', { orderId: p.id })
        .andWhere('id NOT IN (:...currentItemIds)', { currentItemIds })
        .execute()
    }

    if (p.items.length > 0) {
      const items = p.items.map(item =>
        manager.create(OrderItemEntity, {
          id: item.id,
          orderId: p.id,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          currency: item.currency,
          quantity: item.quantity,
          modifiers: item.modifiers,
          notes: item.notes,
          discount: item.discount,
          status: item.status,
          stationId: item.stationId,
          sentAt: item.sentAt,
          readyAt: item.readyAt,
          deliveredAt: item.deliveredAt,
          deliveredBy: item.deliveredBy,
          cancelledAt: item.cancelledAt,
          cancelledBy: item.cancelledBy,
          cancellationReason: item.cancellationReason
        })
      )
      await manager.save(OrderItemEntity, items)
    }
  }

  async search(id: OrderId): Promise<Order | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchWithActiveKitchenItems(): Promise<Order[]> {
    const entities = await this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'i')
      .where(`o.status IN (:...statuses)`, {
        statuses: [OrderStatus.IN_PROGRESS, OrderStatus.OPEN]
      })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM order_items oi
          WHERE oi.order_id = o.id AND oi.status IN ('SENT', 'READY')
        )`
      )
      .orderBy('o.openedAt', 'ASC')
      .getMany()

    return entities.map(e => this.toDomain(e))
  }

  async nextOrderNumber(date: Date): Promise<string> {
    const dateKey = date.toISOString().split('T')[0] // 'YYYY-MM-DD'

    return this.dataSource.transaction(async manager => {
      await manager.query(
        `INSERT INTO order_daily_sequence (date_key, last_number)
         VALUES ($1, 0)
         ON CONFLICT (date_key) DO NOTHING`,
        [dateKey]
      )

      const result = await manager.query(
        `UPDATE order_daily_sequence
         SET last_number = last_number + 1
         WHERE date_key = $1
         RETURNING last_number`,
        [dateKey]
      )

      const number: number = result[0][0].last_number
      return String(number).padStart(3, '0')
    })
  }

  private toDomain(entity: OrderEntity): Order {
    if (entity.items === undefined) {
      throw new OrderItemsNotLoaded(entity.id)
    }

    return Order.fromPrimitives({
      id: entity.id,
      orderNumber: entity.orderNumber,
      type: entity.type,
      status: entity.status,
      tableId: entity.tableId,
      customerId: entity.customerId,
      addressId: entity.addressId,
      deliveryFee: entity.deliveryFee !== null ? Number(entity.deliveryFee) : null,
      currency: entity.currency,
      items: entity.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        unitPrice: Number(item.unitPrice),
        currency: item.currency,
        quantity: item.quantity,
        modifiers: item.modifiers ?? [],
        notes: item.notes,
        discount: item.discount,
        status: item.status,
        sentAt: item.sentAt,
        readyAt: item.readyAt,
        deliveredAt: item.deliveredAt,
        deliveredBy: item.deliveredBy,
        cancelledAt: item.cancelledAt,
        cancelledBy: item.cancelledBy,
        cancellationReason: item.cancellationReason,
        stationId: item.stationId
      })),
      kitchenTickets: entity.kitchenTickets ?? [],
      payments: entity.payments ?? null,
      splits: entity.splits ?? null,
      taxConfig: entity.taxConfig ?? { rate: 0.08, type: 'INC', inclusive: true },
      orderDiscount: entity.orderDiscount ?? null,
      subtotal: Number(entity.subtotal),
      discountTotal: Number(entity.discountTotal ?? 0),
      taxBase: Number(entity.taxBase ?? 0),
      taxAmount: Number(entity.taxAmount ?? 0),
      total: Number(entity.total),
      tip: entity.tip !== null ? Number(entity.tip) : null,
      notes: entity.notes,
      openedBy: entity.openedBy,
      openedAt: entity.openedAt,
      closedBy: entity.closedBy,
      closedAt: entity.closedAt,
      cancelledBy: entity.cancelledBy,
      cancelledAt: entity.cancelledAt,
      cancelledReason: entity.cancelledReason
    })
  }
}

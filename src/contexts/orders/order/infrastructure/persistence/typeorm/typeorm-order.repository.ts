import { Injectable } from '@nestjs/common'
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm'
import { Repository, DataSource } from 'typeorm'

import { Order } from '@contexts/orders/order/domain/order'
import { OrderId } from '@contexts/orders/order/domain/order-id'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { OrderRepository } from '@contexts/orders/order/domain/repositories/order.repository'
import { OrderEntity } from './order.entity'

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  async save(order: Order): Promise<void> {
    const p = order.toPrimitives()
    await this.repository.save({
      id: p.id,
      orderNumber: p.orderNumber,
      type: p.type,
      status: p.status,
      tableId: p.tableId,
      customerId: p.customerId,
      addressId: p.addressId,
      deliveryFee: p.deliveryFee,
      currency: p.currency,
      items: p.items,
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
  }

  async search(id: OrderId): Promise<Order | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    if (!entity) return null
    return this.toDomain(entity)
  }

  async searchWithActiveKitchenItems(): Promise<Order[]> {
    const entities = await this.repository
      .createQueryBuilder('o')
      .where(`o.status IN (:...statuses)`, {
        statuses: [OrderStatus.IN_PROGRESS, OrderStatus.OPEN]
      })
      .andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(o.items) AS item
          WHERE item->>'status' IN ('SENT', 'READY')
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
      items: entity.items ?? [],
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

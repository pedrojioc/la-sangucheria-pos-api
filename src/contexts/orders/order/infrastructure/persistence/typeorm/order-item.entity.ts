import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { OrderEntity } from './order.entity'
import { OrderItemStatus } from '../../../domain/order-item-status'
import { OrderItemModifierPrimitives } from '../../../domain/order-item-modifier'
import { DiscountPrimitives } from '../../../domain/discount'

/**
 * OrderItemEntity - TypeORM Entity
 *
 * Represents an order item (line) in the database.
 * This is a child entity of OrderEntity.
 *
 * Table: order_items
 */
@Entity('order_items')
@Index(['orderId'])
@Index(['orderId', 'status'])
@Index(['status'])
export class OrderItemEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string

  @Column({ type: 'varchar', length: 100, name: 'product_name' })
  productName: string

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'unit_price' })
  unitPrice: number

  @Column({ type: 'varchar', length: 3 })
  currency: string

  @Column({ type: 'smallint' })
  quantity: number

  @Column({ type: 'jsonb', default: '[]' })
  modifiers: OrderItemModifierPrimitives[]

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'jsonb', nullable: true })
  discount: DiscountPrimitives | null

  @Column({ type: 'varchar', length: 20, default: OrderItemStatus.PENDING })
  status: OrderItemStatus

  @Column({ type: 'uuid', name: 'station_id', nullable: true })
  stationId: string | null

  @Column({ type: 'timestamptz', name: 'sent_at', nullable: true })
  sentAt: Date | null

  @Column({ type: 'timestamptz', name: 'ready_at', nullable: true })
  readyAt: Date | null

  @Column({ type: 'timestamptz', name: 'delivered_at', nullable: true })
  deliveredAt: Date | null

  @Column({ type: 'uuid', name: 'delivered_by', nullable: true })
  deliveredBy: string | null

  @Column({ type: 'timestamptz', name: 'cancelled_at', nullable: true })
  cancelledAt: Date | null

  @Column({ type: 'uuid', name: 'cancelled_by', nullable: true })
  cancelledBy: string | null

  @Column({ type: 'text', name: 'cancellation_reason', nullable: true })
  cancellationReason: string | null

  @ManyToOne(() => OrderEntity, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity
}

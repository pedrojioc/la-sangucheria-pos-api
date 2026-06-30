import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { OrderType } from '../../../domain/order-type'
import { OrderStatus } from '../../../domain/order-status'
import { OrderItemPrimitives } from '../../../domain/order-item'
import { KitchenTicketPrimitives } from '../../../domain/kitchen-ticket'
import { OrderPaymentPrimitives } from '../../../domain/order-payment'
import { OrderSplitPrimitives } from '../../../domain/order-split'
import { TaxConfigPrimitives } from '../../../domain/tax-config'
import { DiscountPrimitives } from '../../../domain/discount'

@Entity('orders')
@Index(['status'])
@Index(['type'])
@Index(['tableId'])
@Index(['customerId'])
@Index(['openedAt'])
@Index(['orderNumber', 'openedAt'])
export class OrderEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ name: 'order_number', type: 'varchar', length: 10 })
  orderNumber: string

  @Column({ type: 'varchar', length: 20 })
  type: OrderType

  @Column({ type: 'varchar', length: 20, default: OrderStatus.OPEN })
  status: OrderStatus

  @Column({ name: 'table_id', type: 'uuid', nullable: true })
  tableId: string | null

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null

  @Column({ name: 'address_id', type: 'uuid', nullable: true })
  addressId: string | null

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 12, scale: 2, nullable: true })
  deliveryFee: number | null

  @Column({ type: 'varchar', length: 3, default: 'COP' })
  currency: string

  @Column({ type: 'jsonb', default: '[]' })
  items: OrderItemPrimitives[]

  @Column({ name: 'kitchen_tickets', type: 'jsonb', default: '[]' })
  kitchenTickets: KitchenTicketPrimitives[]

  @Column({ type: 'jsonb', nullable: true })
  payments: OrderPaymentPrimitives[] | null

  @Column({ type: 'jsonb', nullable: true })
  splits: OrderSplitPrimitives[] | null

  @Column({
    name: 'tax_config',
    type: 'jsonb',
    default: () => `'{"rate":0.08,"type":"INC","inclusive":true}'`
  })
  taxConfig: TaxConfigPrimitives

  @Column({ name: 'order_discount', type: 'jsonb', nullable: true })
  orderDiscount: DiscountPrimitives | null

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number

  @Column({ name: 'discount_total', type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountTotal: number

  @Column({ name: 'tax_base', type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxBase: number

  @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  taxAmount: number

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  tip: number | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ name: 'opened_by', type: 'uuid' })
  openedBy: string

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt: Date

  @Column({ name: 'closed_by', type: 'uuid', nullable: true })
  closedBy: string | null

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null

  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy: string | null

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null

  @Column({ name: 'cancelled_reason', type: 'text', nullable: true })
  cancelledReason: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}

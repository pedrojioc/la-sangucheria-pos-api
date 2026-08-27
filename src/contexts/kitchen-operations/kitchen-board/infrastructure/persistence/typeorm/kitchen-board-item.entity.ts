import { Entity, PrimaryColumn, Column, Index } from 'typeorm'

@Entity('kitchen_board_items')
@Index(['stationId', 'status'])
@Index(['orderId'])
export class KitchenBoardItemEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string

  @Column({ name: 'order_number', type: 'varchar', length: 20 })
  orderNumber: string

  @Column({ name: 'order_status', type: 'varchar', length: 20, default: 'OPEN' })
  orderStatus: string

  @Column({ name: 'table_id', type: 'uuid', nullable: true })
  tableId: string | null

  @Column({ name: 'table_label', type: 'varchar', length: 50, nullable: true })
  tableLabel: string | null

  /**
   * Null only for the placeholder row created on OrderOpenedEvent, before any
   * items are sent to kitchen. Real item rows always carry an itemId.
   */
  @Column({ name: 'item_id', type: 'uuid', unique: true, nullable: true })
  itemId: string | null

  @Column({ name: 'item_name', type: 'varchar', length: 100 })
  itemName: string

  @Column({ name: 'station_id', type: 'uuid', nullable: true })
  stationId: string | null

  @Column({ type: 'varchar', length: 20, default: 'SENT' })
  status: string

  @Column({ type: 'smallint' })
  quantity: number

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({ type: 'jsonb', default: '[]' })
  modifiers: Record<string, any>[]

  @Column({ name: 'sent_at', type: 'timestamp' })
  sentAt: Date

  @Column({ name: 'ready_at', type: 'timestamp', nullable: true })
  readyAt: Date | null

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date | null
}

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { TableStatus } from '../../../domain/table-status'
import { TableShape } from '../../../domain/table-shape'

@Entity('tables')
@Index(['number'], { unique: true })
@Index(['status'])
export class TableEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ type: 'varchar', length: 20, unique: true })
  number: string

  @Column({ type: 'smallint' })
  capacity: number

  @Column({ type: 'varchar', length: 20, default: TableStatus.AVAILABLE })
  status: TableStatus

  @Column({ type: 'varchar', length: 20, default: TableShape.SQUARE })
  shape: TableShape

  @Column({ name: 'current_order_id', type: 'uuid', nullable: true })
  currentOrderId: string | null

  @Column({ name: 'zone_id', type: 'uuid', nullable: true })
  zoneId: string | null

  @Column({ name: 'position_x', type: 'decimal', precision: 5, scale: 2, nullable: true })
  positionX: number | null

  @Column({ name: 'position_y', type: 'decimal', precision: 5, scale: 2, nullable: true })
  positionY: number | null

  @Column({ type: 'smallint', default: 0 })
  rotation: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'
import { FloorElementType } from '../../../domain/floor-element-type'

@Entity('floor_elements')
@Index(['zoneId'])
export class FloorElementEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ name: 'zone_id', type: 'uuid' })
  zoneId: string

  @Column({ type: 'varchar', length: 30 })
  type: FloorElementType

  @Column({ type: 'varchar', length: 100, nullable: true })
  label: string | null

  @Column({ name: 'position_x', type: 'decimal', precision: 5, scale: 2 })
  positionX: number

  @Column({ name: 'position_y', type: 'decimal', precision: 5, scale: 2 })
  positionY: number

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  width: number

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10 })
  height: number

  @Column({ type: 'smallint', default: 0 })
  rotation: number

  @Column({ type: 'varchar', length: 20, nullable: true })
  color: string | null

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}

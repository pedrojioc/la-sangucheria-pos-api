import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('stations')
@Index(['name'], { unique: true })
export class StationEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string

  @Column({ name: 'display_order', type: 'smallint', default: 0 })
  displayOrder: number

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null

  @Column({ name: 'output_device', type: 'varchar', length: 10, default: 'kds' })
  outputDevice: string

  @Column({ name: 'printer_address', type: 'varchar', length: 255, nullable: true })
  printerAddress: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}

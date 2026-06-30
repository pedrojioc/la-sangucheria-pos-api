import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm'

@Entity('zones')
@Index(['name'], { unique: true })
export class ZoneEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string

  @Column({ type: 'varchar', length: 20 })
  color: string

  @Column({ name: 'sort_index', type: 'smallint', default: 0 })
  sortIndex: number

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}

import { Entity, PrimaryColumn, Column } from 'typeorm'

@Entity('units')
export class UnitEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 50 })
  name: string

  @Column({ type: 'varchar', length: 10 })
  symbol: string

  @Column({
    type: 'enum',
    enum: ['weight', 'volume', 'length', 'unit']
  })
  type: string

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean
}

import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm'
import { OptionItemEntity } from './option-item.entity'

@Entity('option_groups')
export class OptionGroupEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'varchar', length: 10 })
  type: 'SWAP' | 'ADD'

  @Column({ type: 'boolean', default: true })
  required: boolean

  @Column({ type: 'int', name: 'min_selections', default: 1 })
  minSelections: number

  @Column({ type: 'int', name: 'max_selections', default: 1 })
  maxSelections: number

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @OneToMany(() => OptionItemEntity, item => item.group, {
    cascade: true,
    eager: true
  })
  items: OptionItemEntity[]
}

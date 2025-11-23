import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { RecipeItemEntity } from './recipe-item.entity'
import { UnitEntity } from '@/contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

@Entity('recipes')
export class RecipeEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'yield_quantity' })
  yieldQuantity: number

  @Column({ type: 'uuid', name: 'yield_unit_id' })
  yieldUnitId: string

  @Column({ type: 'varchar', length: 200, nullable: true, name: 'yield_description' })
  yieldDescription: string | null

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'yield_unit_id' })
  yieldUnit: UnitEntity

  @OneToMany(() => RecipeItemEntity, item => item.recipe, {
    cascade: true,
    eager: true
  })
  items: RecipeItemEntity[]
}

import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { OptionGroupEntity } from './option-group.entity'
import { IngredientEntity } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UnitEntity } from '@contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

@Entity('option_items')
export class OptionItemEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string

  @Column({ type: 'varchar', length: 100 })
  label: string

  @Column({ type: 'uuid', name: 'ingredient_id' })
  ingredientId: string

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number

  @Column({ type: 'uuid', name: 'unit_id' })
  unitId: string

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'extra_price', default: 0 })
  extraPrice: number

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean

  @ManyToOne(() => OptionGroupEntity, group => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: OptionGroupEntity

  @ManyToOne(() => IngredientEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity

  @ManyToOne(() => UnitEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity
}

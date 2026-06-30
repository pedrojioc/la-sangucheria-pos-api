import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm'
import { IngredientEntity } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UnitEntity } from '@contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'
import { decimalTransformer } from '@shared/infrastructure/persistence/typeorm/decimal-transformer'

@Entity('inventory_levels')
export class InventoryLevelEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ name: 'ingredient_id', type: 'uuid' })
  @Index({ unique: true })
  ingredientId: string

  @Column({
    name: 'current_quantity',
    type: 'decimal',
    precision: 12,
    scale: 4,
    default: 0,
    transformer: decimalTransformer
  })
  currentQuantity: number

  @Column({ name: 'unit_id', type: 'uuid' })
  unitId: string

  @Column({
    name: 'minimum_quantity',
    type: 'decimal',
    precision: 12,
    scale: 4,
    default: 0,
    transformer: decimalTransformer
  })
  minimumQuantity: number

  @Column({
    name: 'maximum_quantity',
    type: 'decimal',
    precision: 12,
    scale: 4,
    nullable: true,
    transformer: decimalTransformer
  })
  maximumQuantity: number | null

  @Column({
    name: 'reorder_point',
    type: 'decimal',
    precision: 12,
    scale: 4,
    nullable: true,
    transformer: decimalTransformer
  })
  reorderPoint: number | null

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => IngredientEntity)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity
}

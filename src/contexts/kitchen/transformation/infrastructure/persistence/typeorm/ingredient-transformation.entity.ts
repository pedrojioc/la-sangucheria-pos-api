import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { PreparationRecipeEntity } from './preparation-recipe.entity'
import { IngredientEntity } from '@/contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UnitEntity } from '@/contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'
import { decimalTransformer } from '@shared/infrastructure/persistence/typeorm/decimal-transformer'

@Entity('ingredient_transformations')
@Index(['outputIngredientId', 'performedAt'])
@Index(['baseIngredientId', 'performedAt'])
export class IngredientTransformationEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'recipe_id' })
  @Index()
  recipeId: string

  @Column({ type: 'uuid', name: 'base_ingredient_id' })
  @Index()
  baseIngredientId: string

  @Column({ type: 'uuid', name: 'output_ingredient_id' })
  @Index()
  outputIngredientId: string

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'input_quantity',
    transformer: decimalTransformer
  })
  inputQuantity: number

  @Column({ type: 'uuid', name: 'input_unit_id' })
  inputUnitId: string

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'output_quantity',
    transformer: decimalTransformer
  })
  outputQuantity: number

  @Column({ type: 'uuid', name: 'output_unit_id' })
  outputUnitId: string

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'waste_quantity',
    transformer: decimalTransformer
  })
  wasteQuantity: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'base_cost',
    transformer: decimalTransformer
  })
  baseCost: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'additional_cost',
    transformer: decimalTransformer
  })
  additionalCost: number

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_cost',
    transformer: decimalTransformer
  })
  totalCost: number

  @Column({ type: 'varchar', length: 3 })
  currency: string

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'output_unit_cost',
    transformer: decimalTransformer
  })
  outputUnitCost: number

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'performed_by' })
  performedBy: string | null

  @Column({ type: 'timestamp', name: 'performed_at' })
  @Index()
  performedAt: Date

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => PreparationRecipeEntity)
  @JoinColumn({ name: 'recipe_id' })
  recipe: PreparationRecipeEntity

  @ManyToOne(() => IngredientEntity)
  @JoinColumn({ name: 'base_ingredient_id' })
  baseIngredient: IngredientEntity

  @ManyToOne(() => IngredientEntity)
  @JoinColumn({ name: 'output_ingredient_id' })
  outputIngredient: IngredientEntity

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'input_unit_id' })
  inputUnit: UnitEntity

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'output_unit_id' })
  outputUnit: UnitEntity
}

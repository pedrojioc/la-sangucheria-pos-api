import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm'

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

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'input_quantity' })
  inputQuantity: number

  @Column({ type: 'uuid', name: 'input_unit_id' })
  inputUnitId: string

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'output_quantity' })
  outputQuantity: number

  @Column({ type: 'uuid', name: 'output_unit_id' })
  outputUnitId: string

  @Column({ type: 'decimal', precision: 12, scale: 3, name: 'waste_quantity' })
  wasteQuantity: number

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'base_cost' })
  baseCost: number

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'additionals_cost' })
  additionalsCost: number

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_cost' })
  totalCost: number

  @Column({ type: 'varchar', length: 3 })
  currency: string

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'output_unit_cost' })
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
}

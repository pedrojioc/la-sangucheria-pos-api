import { IngredientEntity } from '@/contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm'
import { IngredientTransformationEntity } from './ingredient-transformation.entity'

@Entity('preparation_recipes')
export class PreparationRecipeEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'uuid', name: 'base_ingredient_id' })
  @Index()
  baseIngredientId: string

  @Column({ type: 'uuid', name: 'output_ingredient_id' })
  @Index()
  outputIngredientId: string

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'yield_percentage' })
  yieldPercentage: number

  @Column({ type: 'jsonb', name: 'additional_ingredients' })
  additionalIngredients: Array<{
    ingredientId: string
    quantityPerUnit: number
    unitId: string
  }>

  @Column({ type: 'boolean', name: 'is_active', default: true })
  @Index()
  isActive: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => IngredientEntity)
  @JoinColumn({ name: 'base_ingredient_id' })
  baseIngredient: IngredientEntity

  @ManyToOne(() => IngredientEntity)
  @JoinColumn({ name: 'output_ingredient_id' })
  outputIngredient: IngredientEntity

  @OneToMany(() => IngredientTransformationEntity, transformation => transformation.recipe)
  transformations: IngredientTransformationEntity[]
}

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
import { decimalTransformer } from '@shared/infrastructure/persistence/typeorm/decimal-transformer'

@Entity('preparation_recipe_ingredients')
@Index(['recipeId', 'ingredientId'], { unique: true })
export class PreparationRecipeIngredientEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'recipe_id' })
  @Index()
  recipeId: string

  @Column({ type: 'uuid', name: 'ingredient_id' })
  ingredientId: string

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 3,
    name: 'quantity_per_unit',
    transformer: decimalTransformer
  })
  quantityPerUnit: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @ManyToOne(() => PreparationRecipeEntity, recipe => recipe.additionalIngredients)
  @JoinColumn({ name: 'recipe_id' })
  recipe: PreparationRecipeEntity

  @ManyToOne(() => IngredientEntity)
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity
}

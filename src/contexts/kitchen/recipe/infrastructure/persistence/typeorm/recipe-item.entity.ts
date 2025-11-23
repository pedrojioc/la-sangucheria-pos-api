import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { RecipeEntity } from './recipe.entity'
import { IngredientEntity } from '@/contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UnitEntity } from '@/contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

@Entity('recipe_items')
export class RecipeItemEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'recipe_id' })
  recipeId: string

  @Column({ type: 'uuid', name: 'ingredient_id' })
  ingredientId: string

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number

  @Column({ type: 'uuid', name: 'unit_id' })
  unitId: string

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number

  @ManyToOne(() => RecipeEntity, recipe => recipe.items, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'recipe_id' })
  recipe: RecipeEntity

  @ManyToOne(() => IngredientEntity, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity

  @ManyToOne(() => UnitEntity, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity
}

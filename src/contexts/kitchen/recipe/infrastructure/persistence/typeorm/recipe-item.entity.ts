import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { RecipeEntity } from './recipe.entity'

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
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'recipe_id' })
  recipe: RecipeEntity
}

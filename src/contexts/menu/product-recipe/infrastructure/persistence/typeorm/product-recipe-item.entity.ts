import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ProductRecipeEntity } from './product-recipe.entity'
import { IngredientEntity } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UnitEntity } from '@contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

@Entity('product_recipe_items')
export class ProductRecipeItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'product_recipe_id' })
  productRecipeId: string

  @Column({ type: 'uuid', name: 'ingredient_id' })
  ingredientId: string

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number

  @Column({ type: 'uuid', name: 'unit_id' })
  unitId: string

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number

  @ManyToOne(() => ProductRecipeEntity, recipe => recipe.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_recipe_id' })
  recipe: ProductRecipeEntity

  @ManyToOne(() => IngredientEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity

  @ManyToOne(() => UnitEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'unit_id' })
  unit: UnitEntity
}

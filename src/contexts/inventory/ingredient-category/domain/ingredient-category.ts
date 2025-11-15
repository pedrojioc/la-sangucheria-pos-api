import { AggregateRoot } from '@shared/domain/aggregate-root'
import { IngredientCategoryId } from './ingredient-category-id'
import { IngredientCategoryName } from './ingredient-category-name'
import { IngredientCategoryDescription } from './ingredient-category-description'
import { IngredientCategoryIcon } from './ingredient-category-icon'
import { IngredientCategoryColor } from './ingredient-category-color'
import { IngredientCategorySortOrder } from './ingredient-category-sort-order'
import { IngredientCategoryIsActive } from './ingredient-category-is-active'
import { IngredientCategoryCreatedEvent } from './events/ingredient-category-created.event'

export interface IngredientCategoryPrimitives {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  sortOrder: number | null
  isActive: boolean
}

export class IngredientCategory extends AggregateRoot {
  private constructor(
    public readonly id: IngredientCategoryId,
    private readonly name: IngredientCategoryName,
    private readonly description: IngredientCategoryDescription | null,
    private readonly icon: IngredientCategoryIcon | null,
    private readonly color: IngredientCategoryColor | null,
    private readonly sortOrder: IngredientCategorySortOrder | null,
    private readonly isActive: IngredientCategoryIsActive
  ) {
    super()
  }

  static create(
    id: string,
    name: string,
    description: string | null,
    icon: string | null,
    color: string | null,
    sortOrder: number | null,
    isActive: boolean
  ): IngredientCategory {
    const ingredientCategory = IngredientCategory.fromPrimitives({
      id,
      name,
      description,
      icon,
      color,
      sortOrder,
      isActive
    })

    ingredientCategory.record(
      new IngredientCategoryCreatedEvent({
        id,
        name
      })
    )

    return ingredientCategory
  }

  static fromPrimitives(primitives: IngredientCategoryPrimitives) {
    return new IngredientCategory(
      new IngredientCategoryId(primitives.id),
      new IngredientCategoryName(primitives.name),
      primitives.description !== null
        ? new IngredientCategoryDescription(primitives.description)
        : null,
      primitives.icon !== null ? new IngredientCategoryIcon(primitives.icon) : null,
      primitives.color !== null ? new IngredientCategoryColor(primitives.color) : null,
      primitives.sortOrder !== null ? new IngredientCategorySortOrder(primitives.sortOrder) : null,
      new IngredientCategoryIsActive(primitives.isActive)
    )
  }

  toPrimitives(): IngredientCategoryPrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      description: this.description?.value ?? null,
      icon: this.icon?.value ?? null,
      color: this.color?.value ?? null,
      sortOrder: this.sortOrder?.value ?? null,
      isActive: this.isActive.value
    }
  }
}

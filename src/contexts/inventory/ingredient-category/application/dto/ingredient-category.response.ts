import { IngredientCategory } from '../../domain/ingredient-category'

export class IngredientCategoryResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly icon: string | null,
    public readonly color: string | null,
    public readonly sortOrder: number | null,
    public readonly isActive: boolean
  ) {}

  static fromDomain(category: IngredientCategory) {
    const primitives = category.toPrimitives()
    return new IngredientCategoryResponse(
      primitives.id,
      primitives.name,
      primitives.description,
      primitives.icon,
      primitives.color,
      primitives.sortOrder,
      primitives.isActive
    )
  }
}

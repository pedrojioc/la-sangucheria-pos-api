import { Ingredient } from '../../domain/ingredient'

export class IngredientResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly categoryId: string,
    public readonly baseUnit: string,
    public readonly preferredSupplierId: string | null,
    public readonly minimumStock: number | null,
    public readonly maximumStock: number | null,
    public readonly isPerishable: boolean,
    public readonly shelfLifeDays: number | null,
    public readonly storageLocation: string | null,
    public readonly isActive: boolean
  ) {}

  static fromDomain(ingredient: Ingredient) {
    const primitives = ingredient.toPrimitives()
    return new IngredientResponse(
      primitives.id,
      primitives.name,
      primitives.description,
      primitives.ingredientCategoryId,
      primitives.unitId,
      primitives.preferredSupplierId,
      primitives.minimumStock,
      primitives.maximumStock,
      primitives.isPerishable,
      primitives.shelfLifeDays,
      primitives.storageLocation,
      primitives.isActive
    )
  }
}

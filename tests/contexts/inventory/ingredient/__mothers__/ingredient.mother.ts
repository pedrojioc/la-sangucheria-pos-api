import { Ingredient } from '@contexts/inventory/ingredient/domain/ingredient'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class IngredientMother {
  static create(
    params: Partial<{
      id: string
      name: string
      description: string | null
      ingredientCategoryId: string
      unitId: string
      preferredSupplierId: string | null
      minimumStock: number | null
      maximumStock: number | null
      isPerishable: boolean
      shelfLifeDays: number | null
      storageLocation: string | null
      isActive: boolean
    }> = {}
  ): Ingredient {
    return Ingredient.create(
      params.id ?? UuidMother.random(),
      params.name ?? 'Tomato',
      params.description ?? null,
      params.ingredientCategoryId ?? UuidMother.random(),
      params.unitId ?? UuidMother.random(),
      params.preferredSupplierId ?? null,
      params.minimumStock ?? null,
      params.maximumStock ?? null,
      params.isPerishable ?? false,
      params.shelfLifeDays ?? null,
      params.storageLocation ?? null,
      params.isActive ?? true
    )
  }

  static random(): Ingredient {
    return this.create()
  }
}

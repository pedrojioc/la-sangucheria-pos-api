import { AggregateRoot } from '@shared/domain/aggregate-root'
import { IngredientPreferredSupplierId } from './ingredient-proferred-supplier-id'
import { UnitId } from '@shared-kernel/unit/domain/unit-id'
import { IngredientCategoryId } from '@contexts/inventory/ingredient-category/domain/ingredient-category-id'

import { IngredientId } from './ingredient-id'
import { IngredientName } from './ingredient-name'
import { IngredientDescription } from './ingredient-description'
import { IngredientMinimumStock } from './ingredient-minimum-stock'
import { IngredientMaximumStock } from './ingredient-maximum-stock'
import { IngredientIsPerishable } from './ingredient-is-perishable'
import { IngredientShelfLifeDays } from './ingredient-shelf-life-days'
import { IngredientStorageLocation } from './ingredient-storage-location'
import { IngredientIsActive } from './ingredient-is-active'
import { IngredientCreatedEvent } from './events/ingredient-created.event'
import { IngredientUpdatedEvent } from './events/ingredient-updated.event'

export interface IngredientPrimitives {
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
}

export class Ingredient extends AggregateRoot {
  private constructor(
    public readonly id: IngredientId,
    private name: IngredientName,
    private description: IngredientDescription | null,
    private ingredientCategoryId: IngredientCategoryId,
    private readonly unitId: UnitId,
    private preferredSupplierId: IngredientPreferredSupplierId | null,
    private minimumStock: IngredientMinimumStock | null,
    private maximumStock: IngredientMaximumStock | null,
    private isPerishable: IngredientIsPerishable,
    private shelfLifeDays: IngredientShelfLifeDays | null,
    private storageLocation: IngredientStorageLocation | null,
    private isActive: IngredientIsActive
  ) {
    super()
  }

  static create(
    id: string,
    name: string,
    description: string | null,
    ingredientCategoryId: string,
    unitId: string,
    preferredSupplierId: string | null,
    minimumStock: number | null,
    maximumStock: number | null,
    isPerishable: boolean,
    shelfLifeDays: number | null,
    storageLocation: string | null,
    isActive: boolean
  ) {
    const ingredient = Ingredient.fromPrimitives({
      id,
      name,
      description,
      ingredientCategoryId,
      unitId,
      preferredSupplierId,
      minimumStock,
      maximumStock,
      isPerishable,
      shelfLifeDays,
      storageLocation,
      isActive
    })

    ingredient.record(
      new IngredientCreatedEvent({
        ingredientId: id,
        name,
        ingredientCategoryId,
        unitId
      })
    )

    return ingredient
  }

  update(
    name: string,
    description: string | null,
    ingredientCategoryId: string,
    preferredSupplierId: string | null,
    minimumStock: number | null,
    maximumStock: number | null,
    isPerishable: boolean,
    shelfLifeDays: number | null,
    storageLocation: string | null,
    isActive: boolean
  ): void {
    this.name = new IngredientName(name)
    this.description = description !== null ? new IngredientDescription(description) : null
    this.ingredientCategoryId = new IngredientCategoryId(ingredientCategoryId)
    this.preferredSupplierId =
      preferredSupplierId !== null ? new IngredientPreferredSupplierId(preferredSupplierId) : null
    this.minimumStock = minimumStock !== null ? new IngredientMinimumStock(minimumStock) : null
    this.maximumStock = maximumStock !== null ? new IngredientMaximumStock(maximumStock) : null
    this.isPerishable = new IngredientIsPerishable(isPerishable)
    this.shelfLifeDays = shelfLifeDays !== null ? new IngredientShelfLifeDays(shelfLifeDays) : null
    this.storageLocation =
      storageLocation !== null ? new IngredientStorageLocation(storageLocation) : null
    this.isActive = new IngredientIsActive(isActive)

    this.record(
      new IngredientUpdatedEvent({
        ingredientId: this.id.value,
        name,
        ingredientCategoryId,
        unitId: this.unitId.value
      })
    )
  }

  static fromPrimitives(primitives: IngredientPrimitives) {
    return new Ingredient(
      new IngredientId(primitives.id),
      new IngredientName(primitives.name),
      primitives.description !== null ? new IngredientDescription(primitives.description) : null,
      new IngredientCategoryId(primitives.ingredientCategoryId),
      new UnitId(primitives.unitId),
      primitives.preferredSupplierId !== null
        ? new IngredientPreferredSupplierId(primitives.preferredSupplierId)
        : null,
      primitives.minimumStock !== null ? new IngredientMinimumStock(primitives.minimumStock) : null,
      primitives.maximumStock !== null ? new IngredientMaximumStock(primitives.maximumStock) : null,
      new IngredientIsPerishable(primitives.isPerishable),
      primitives.shelfLifeDays !== null
        ? new IngredientShelfLifeDays(primitives.shelfLifeDays)
        : null,
      primitives.storageLocation !== null
        ? new IngredientStorageLocation(primitives.storageLocation)
        : null,
      new IngredientIsActive(primitives.isActive)
    )
  }

  toPrimitives(): IngredientPrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      description: this.description?.value ?? null,
      ingredientCategoryId: this.ingredientCategoryId.value,
      unitId: this.unitId.value,
      preferredSupplierId: this.preferredSupplierId?.value ?? null,
      minimumStock: this.minimumStock?.value ?? null,
      maximumStock: this.maximumStock?.value ?? null,
      isPerishable: this.isPerishable.value,
      shelfLifeDays: this.shelfLifeDays?.value ?? null,
      storageLocation: this.storageLocation?.value ?? null,
      isActive: this.isActive.value
    }
  }
}

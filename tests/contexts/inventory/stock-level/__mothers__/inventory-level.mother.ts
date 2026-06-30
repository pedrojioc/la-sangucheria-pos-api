import { InventoryLevel } from '@contexts/inventory/stock-level/domain/inventory-level'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { UnitId } from '@contexts/shared-kernel/unit/domain/unit-id'
import { Quantity } from '@shared/domain/value-objects/quantity'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'

export class InventoryLevelMother {
  static create(
    params: Partial<{
      id: string
      ingredientId: string
      currentQuantity: number
      unitId: string
      minimumStock: number | null
      reorderPoint: number | null
    }> = {}
  ): InventoryLevel {
    const id = params.id ?? UuidMother.random()
    const ingredientId = params.ingredientId ?? UuidMother.random()
    const currentQuantity = params.currentQuantity ?? NumberMother.random({ min: 10, max: 100 })
    const unitId = params.unitId ?? UuidMother.random()
    const minimumStock =
      params.minimumStock === undefined
        ? NumberMother.random({ min: 1, max: 10 })
        : params.minimumStock
    const reorderPoint =
      params.reorderPoint === undefined
        ? minimumStock
          ? minimumStock * 2
          : null
        : params.reorderPoint

    return InventoryLevel.fromPrimitives({
      id,
      ingredientId,
      currentQuantity,
      unitId,
      minimumQuantity: 1,
      maximumQuantity: null,
      reorderPoint
    })
  }

  static random(): InventoryLevel {
    return this.create()
  }

  static withIngredient(ingredientId: string): InventoryLevel {
    return this.create({ ingredientId })
  }

  static outOfStock(): InventoryLevel {
    return this.create({
      currentQuantity: 0,
      minimumStock: NumberMother.random({ min: 5, max: 10 })
    })
  }

  static lowStock(): InventoryLevel {
    const minimumStock = NumberMother.random({ min: 10, max: 20 })
    const currentQuantity = NumberMother.random({ min: 1, max: minimumStock - 1 })
    return this.create({
      currentQuantity,
      minimumStock
    })
  }

  static belowReorderPoint(): InventoryLevel {
    const minimumStock = 10
    const reorderPoint = 20
    const currentQuantity = NumberMother.random({ min: minimumStock, max: reorderPoint - 1 })
    return this.create({
      currentQuantity,
      minimumStock,
      reorderPoint
    })
  }

  static normalStock(): InventoryLevel {
    const minimumStock = 10
    const reorderPoint = 20
    const currentQuantity = NumberMother.random({ min: reorderPoint + 1, max: 100 })
    return this.create({
      currentQuantity,
      minimumStock,
      reorderPoint
    })
  }

  static withoutThresholds(): InventoryLevel {
    return this.create({
      minimumStock: null,
      reorderPoint: null
    })
  }
}

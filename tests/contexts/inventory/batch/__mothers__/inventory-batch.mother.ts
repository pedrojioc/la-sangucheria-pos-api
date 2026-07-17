import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchId } from '@contexts/inventory/batch/domain/inventory-batch-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { UnitId } from '@contexts/shared-kernel/unit/domain/unit-id'
import { Quantity } from '@shared/domain/value-objects/quantity'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'

export class InventoryBatchMother {
  static create(
    params: Partial<{
      id: string
      ingredientId: string
      unitId: string
      initialQuantity: number
      availableQuantity: number
      unitCost: number
      currency: string
      receivedAt: Date
      expiresAt: Date | null
      supplierId: string | null
    }> = {}
  ): InventoryBatch {
    const id = params.id ?? UuidMother.random()
    const ingredientId = params.ingredientId ?? UuidMother.random()
    const unitId = params.unitId ?? UuidMother.random()
    const initialQuantity = params.initialQuantity ?? NumberMother.random({ min: 10, max: 100 })
    const availableQuantity = params.availableQuantity ?? initialQuantity
    const unitCost = params.unitCost ?? NumberMother.random({ min: 1, max: 100 }) // TODO: Use randomFloat
    const currency = params.currency ?? 'COP'
    const receivedAt = params.receivedAt ?? new Date()
    const expiresAt =
      params.expiresAt === undefined
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        : params.expiresAt
    const supplierId = params.supplierId === undefined ? UuidMother.random() : params.supplierId

    return InventoryBatch.fromPrimitives({
      id,
      ingredientId,
      unitId,
      initialQuantity,
      remainingQuantity: availableQuantity,
      unitCost,
      currency,
      purchaseDate: receivedAt,
      expirationDate: expiresAt,
      supplierId,
      referenceCode: null
    })
  }

  static random(): InventoryBatch {
    return this.create()
  }

  static withIngredient(ingredientId: string): InventoryBatch {
    return this.create({ ingredientId })
  }

  static fullyConsumed(): InventoryBatch {
    const initialQuantity = NumberMother.random({ min: 10, max: 100 })
    return this.create({
      initialQuantity,
      availableQuantity: 0
    })
  }

  static partiallyConsumed(): InventoryBatch {
    const initialQuantity = NumberMother.random({ min: 20, max: 100 })
    const availableQuantity = NumberMother.random({ min: 1, max: initialQuantity - 1 })
    return this.create({
      initialQuantity,
      availableQuantity
    })
  }

  static expired(): InventoryBatch {
    return this.create({
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    })
  }

  static expiresIn(days: number): InventoryBatch {
    return this.create({
      expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    })
  }

  static withoutExpiry(): InventoryBatch {
    return this.create({
      expiresAt: null
    })
  }

  static withCost(unitCost: number, currency: string = 'COP'): InventoryBatch {
    return this.create({ unitCost, currency })
  }
}

import { InventoryMovement } from '@contexts/inventory/stock-level/domain/inventory-movement'
import { InventoryMovementId } from '@contexts/inventory/stock-level/domain/inventory-movement-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { UnitId } from '@contexts/shared-kernel/unit/domain/unit-id'
import { Quantity } from '@shared/domain/value-objects/quantity'
import { MovementType } from '@contexts/inventory/stock-level/domain/movement-type'
import { Money } from '@shared/domain/value-objects/money'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'
import { StringMother } from '@test/shared/__mothers__/StringMother'

export class InventoryMovementMother {
  static create(
    params: Partial<{
      id: string
      ingredientId: string
      unitId: string
      quantity: number
      movementType: MovementType
      referenceId: string | null
      reason: string | null
      totalCost: number | null
      currency: string | null
      occurredAt: Date
    }> = {}
  ): InventoryMovement {
    const id = params.id ?? UuidMother.random()
    const ingredientId = params.ingredientId ?? UuidMother.random()
    const unitId = params.unitId ?? UuidMother.random()
    const quantity = params.quantity ?? NumberMother.random({ min: 1, max: 50 })
    const movementType = params.movementType ?? MovementType.PURCHASE
    const referenceId = params.referenceId === undefined ? UuidMother.random() : params.referenceId
    const reason =
      params.reason === undefined
        ? movementType === MovementType.ADJUSTMENT
          ? StringMother.sentence()
          : null
        : params.reason
    const totalCost =
      params.totalCost === undefined
        ? movementType === MovementType.PURCHASE
          ? NumberMother.random({ min: 10, max: 500 })
          : null
        : params.totalCost
    const currency =
      params.currency === undefined ? (totalCost !== null ? 'PEN' : null) : params.currency
    const occurredAt = params.occurredAt ?? new Date()

    return InventoryMovement.fromPrimitives({
      id,
      ingredientId,
      unitId,
      quantity,
      referenceId,
      reason,
      batchId: null,
      type: MovementType.PURCHASE,
      unitCost: 0,
      currency: '',
      totalCost: 0,
      performedBy: null,
      performedAt: occurredAt
    })
  }

  static random(): InventoryMovement {
    return this.create()
  }

  static purchase(): InventoryMovement {
    return this.create({
      movementType: MovementType.PURCHASE,
      totalCost: NumberMother.random({ min: 10, max: 500 }),
      currency: 'PEN'
    })
  }

  static deduction(): InventoryMovement {
    return this.create({
      movementType: MovementType.SALE,
      totalCost: null,
      currency: null
    })
  }

  static adjustment(reason: string): InventoryMovement {
    return this.create({
      movementType: MovementType.ADJUSTMENT,
      reason,
      totalCost: null,
      currency: null
    })
  }

  static expiry(): InventoryMovement {
    return this.create({
      movementType: MovementType.WASTE,
      reason: 'Producto vencido',
      totalCost: null,
      currency: null
    })
  }

  static withIngredient(ingredientId: string): InventoryMovement {
    return this.create({ ingredientId })
  }

  static withCost(totalCost: number, currency: string = 'PEN'): InventoryMovement {
    return this.create({
      movementType: MovementType.PURCHASE,
      totalCost,
      currency
    })
  }
}

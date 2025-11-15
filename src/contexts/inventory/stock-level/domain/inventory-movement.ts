import { Money } from '@/shared/domain/value-objects/money'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { InventoryBatchId } from '@contexts/inventory/batch/domain/inventory-batch-id'
import { Entity } from '@shared/domain/entity'

import { InventoryMovementId } from './inventory-movement-id'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { MovementType } from './movement-type'

export interface InventoryMovementPrimitives extends Entity {
  id: string
  ingredientId: string
  batchId: string | null // Null si es un movimiento sin lote (ej: ajuste manual)
  type: MovementType
  quantity: number
  unitId: string
  unitCost: number
  currency: string
  totalCost: number
  reason: string | null
  referenceId: string | null // ID de venta, orden, etc.
  performedBy: string | null // Usuario que realizó el movimiento
  performedAt: Date
}

/**
 * InventoryMovement - Entity
 *
 * Registro INMUTABLE de cualquier movimiento de inventario.
 * Cada movimiento representa una entrada o salida de stock.
 *
 * Características:
 * - Inmutable: Una vez creado, no se modifica
 * - Audit trail: Rastrea quién, cuándo, por qué
 * - Event sourcing lite: Historia completa de movimientos
 * - FIFO tracking: Relacionado con un batch específico
 *
 * Reglas de negocio:
 * - No se puede modificar después de crear
 * - Siempre tiene un tipo (PURCHASE, SALE, etc.)
 * - PURCHASE siempre tiene batchId
 * - SALE puede tener múltiples movimientos (uno por batch consumido)
 */
export class InventoryMovement {
  private constructor(
    public readonly id: InventoryMovementId,
    public readonly ingredientId: IngredientId,
    public readonly batchId: InventoryBatchId | null,
    public readonly type: MovementType,
    public readonly quantity: Quantity,
    public readonly unitCost: Money,
    public readonly totalCost: Money,
    public readonly reason: string | null,
    public readonly referenceId: string | null,
    public readonly performedBy: string | null,
    public readonly performedAt: Date
  ) {
    this.ensurePurchaseHasBatch()
  }

  static create(
    id: string,
    ingredientId: string,
    type: MovementType,
    quantity: number,
    unitId: string,
    unitCost: number,
    currency: string,
    batchId: string | null = null,
    reason: string | null = null,
    referenceId: string | null = null,
    performedBy: string | null = null,
    performedAt: Date = new Date()
  ): InventoryMovement {
    const quantityVO = new Quantity(quantity, unitId)
    const unitCostVO = new Money(unitCost, currency)
    const totalCost = unitCostVO.multiply(quantity)

    return new InventoryMovement(
      new InventoryMovementId(id),
      new IngredientId(ingredientId),
      batchId ? new InventoryBatchId(batchId) : null,
      type,
      quantityVO,
      unitCostVO,
      totalCost,
      reason,
      referenceId,
      performedBy,
      performedAt
    )
  }

  isInbound(): boolean {
    return this.type === MovementType.PURCHASE
  }

  isOutbound(): boolean {
    return (
      this.type === MovementType.SALE ||
      this.type === MovementType.WASTE ||
      this.type === MovementType.ADJUSTMENT
    )
  }

  private ensurePurchaseHasBatch(): void {
    if (this.type === MovementType.PURCHASE && !this.batchId) {
      throw new Error('PURCHASE movements must have a batch ID')
    }
  }

  toPrimitives(): InventoryMovementPrimitives {
    return {
      id: this.id.value,
      ingredientId: this.ingredientId.value,
      batchId: this.batchId?.value ?? null,
      type: this.type,
      quantity: this.quantity.value,
      unitId: this.quantity.unitId,
      unitCost: this.unitCost.amount,
      currency: this.unitCost.currency,
      totalCost: this.totalCost.amount,
      reason: this.reason,
      referenceId: this.referenceId,
      performedBy: this.performedBy,
      performedAt: this.performedAt
    }
  }

  static fromPrimitives(primitives: InventoryMovementPrimitives): InventoryMovement {
    return new InventoryMovement(
      new InventoryMovementId(primitives.id),
      new IngredientId(primitives.ingredientId),
      primitives.batchId ? new InventoryBatchId(primitives.batchId) : null,
      primitives.type,
      new Quantity(primitives.quantity, primitives.unitId),
      new Money(primitives.unitCost, primitives.currency),
      new Money(primitives.totalCost, primitives.currency),
      primitives.reason,
      primitives.referenceId,
      primitives.performedBy,
      primitives.performedAt
    )
  }
}

import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { InventoryLevelId } from './inventory-level-id'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { OutOfStockEvent } from './events/out-of-stock.event'
import { LowStockDetectedEvent } from './events/low-stock-detected.event'

export interface InventoryLevelPrimitives {
  id: string
  ingredientId: string
  currentQuantity: number
  unitId: string
  minimumQuantity: number | null
  maximumQuantity: number | null
  reorderPoint: number | null
}

/**
 * InventoryLevel - Aggregate Root
 *
 * Representa el nivel actual de stock de un ingrediente.
 * Este agregado se actualiza con cada movimiento de inventario.
 *
 * Características:
 * - Tracking en tiempo real del stock actual
 * - Alertas de stock bajo/alto mediante eventos
 * - Punto de reorden para compras automáticas
 *
 * Reglas de negocio:
 * - currentQuantity nunca puede ser negativa
 * - minimumQuantity < maximumQuantity (si ambos están definidos)
 * - reorderPoint típicamente entre minimum y maximum
 * - Emite eventos cuando se cruzan umbrales (low stock, out of stock)
 */
export class InventoryLevel extends AggregateRoot {
  private constructor(
    public readonly id: InventoryLevelId,
    public readonly ingredientId: IngredientId,
    private currentQuantity: Quantity,
    private minimumQuantity: Quantity | null,
    private maximumQuantity: Quantity | null,
    private reorderPoint: Quantity | null
  ) {
    super()
    this.ensureCurrentQuantityIsNotNegative()
    this.ensureMinimumIsLessThanMaximum()
    this.ensureQuantitiesHaveSameUnit()
  }

  static create(
    id: string,
    ingredientId: string,
    initialQuantity: number,
    unitId: string,
    minimumQuantity: number | null = null,
    maximumQuantity: number | null = null,
    reorderPoint: number | null = null
  ): InventoryLevel {
    const now = new Date()

    return new InventoryLevel(
      new InventoryLevelId(id),
      new IngredientId(ingredientId),
      new Quantity(initialQuantity, unitId),
      minimumQuantity !== null ? new Quantity(minimumQuantity, unitId) : null,
      maximumQuantity !== null ? new Quantity(maximumQuantity, unitId) : null,
      reorderPoint !== null ? new Quantity(reorderPoint, unitId) : null
    )
  }

  increase(quantity: Quantity): void {
    this.ensureSameUnit(quantity)
    this.currentQuantity = this.currentQuantity.add(quantity)

    // TODO: Emit OverstockDetected event if exceeds maximum
  }

  decrease(quantity: Quantity): void {
    this.ensureSameUnit(quantity)
    this.ensureSufficientStock(quantity)

    this.currentQuantity = this.currentQuantity.subtract(quantity)

    // Emit events based on stock levels
    this.checkAndEmitStockEvents()
  }

  private checkAndEmitStockEvents(): void {
    // Check out of stock
    if (this.isOutOfStock()) {
      this.record(
        new OutOfStockEvent({
          ingredientId: this.ingredientId.value,
          unitId: this.currentQuantity.unitId,
          detectedAt: new Date()
        })
      )
    }
    // Check low stock (only if not out of stock)
    else if (this.isLowStock()) {
      this.record(
        new LowStockDetectedEvent({
          ingredientId: this.ingredientId.value,
          currentQuantity: this.currentQuantity.value,
          minimumQuantity: this.minimumQuantity!.value,
          unitId: this.currentQuantity.unitId,
          detectedAt: new Date()
        })
      )
    }
  }

  setThresholds(minimum: number | null, maximum: number | null, reorderPoint: number | null): void {
    const unitId = this.currentQuantity.unitId

    this.minimumQuantity = minimum !== null ? new Quantity(minimum, unitId) : null
    this.maximumQuantity = maximum !== null ? new Quantity(maximum, unitId) : null
    this.reorderPoint = reorderPoint !== null ? new Quantity(reorderPoint, unitId) : null

    this.ensureMinimumIsLessThanMaximum()
  }

  isLowStock(): boolean {
    if (!this.minimumQuantity) return false
    return this.currentQuantity.isLessThan(this.minimumQuantity)
  }

  isBelowReorderPoint(): boolean {
    if (!this.reorderPoint) return false
    return this.currentQuantity.isLessOrEqual(this.reorderPoint)
  }

  isOutOfStock(): boolean {
    return this.currentQuantity.value === 0
  }

  isOverstock(): boolean {
    if (!this.maximumQuantity) return false
    return this.currentQuantity.isGreaterThan(this.maximumQuantity)
  }

  getCurrentQuantity(): Quantity {
    return this.currentQuantity
  }

  private ensureCurrentQuantityIsNotNegative(): void {
    if (this.currentQuantity.value < 0) {
      throw new Error('Current quantity cannot be negative')
    }
  }

  private ensureMinimumIsLessThanMaximum(): void {
    if (this.minimumQuantity && this.maximumQuantity) {
      if (this.minimumQuantity.isGreaterOrEqual(this.maximumQuantity)) {
        throw new Error('Minimum quantity must be less than maximum quantity')
      }
    }
  }

  private ensureQuantitiesHaveSameUnit(): void {
    const unitId = this.currentQuantity.unitId

    if (this.minimumQuantity && this.minimumQuantity.unitId !== unitId) {
      throw new Error('All quantities must have the same unit')
    }
    if (this.maximumQuantity && this.maximumQuantity.unitId !== unitId) {
      throw new Error('All quantities must have the same unit')
    }
    if (this.reorderPoint && this.reorderPoint.unitId !== unitId) {
      throw new Error('All quantities must have the same unit')
    }
  }

  private ensureSameUnit(quantity: Quantity): void {
    if (this.currentQuantity.unitId !== quantity.unitId) {
      throw new Error(
        `Quantity unit (${quantity.unitId}) does not match inventory unit (${this.currentQuantity.unitId})`
      )
    }
  }

  private ensureSufficientStock(quantity: Quantity): void {
    if (this.currentQuantity.isLessThan(quantity)) {
      throw new Error(
        `Insufficient stock. Available: ${this.currentQuantity.value}, Requested: ${quantity.value}`
      )
    }
  }

  toPrimitives(): InventoryLevelPrimitives {
    return {
      id: this.id.value,
      ingredientId: this.ingredientId.value,
      currentQuantity: this.currentQuantity.value,
      unitId: this.currentQuantity.unitId,
      minimumQuantity: this.minimumQuantity?.value ?? null,
      maximumQuantity: this.maximumQuantity?.value ?? null,
      reorderPoint: this.reorderPoint?.value ?? null
    }
  }

  static fromPrimitives(primitives: InventoryLevelPrimitives): InventoryLevel {
    return new InventoryLevel(
      new InventoryLevelId(primitives.id),
      new IngredientId(primitives.ingredientId),
      new Quantity(primitives.currentQuantity, primitives.unitId),
      primitives.minimumQuantity !== null
        ? new Quantity(primitives.minimumQuantity, primitives.unitId)
        : null,
      primitives.maximumQuantity !== null
        ? new Quantity(primitives.maximumQuantity, primitives.unitId)
        : null,
      primitives.reorderPoint !== null
        ? new Quantity(primitives.reorderPoint, primitives.unitId)
        : null
    )
  }
}

import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { Money } from '@shared/domain/value-objects/money'
import { Quantity } from '@shared/domain/value-objects/quantity'
import { InventoryBatchId } from './inventory-batch-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { UnitId } from '@/contexts/shared-kernel/unit/domain/unit-id'
import { InventoryBatchInitialQuantity } from './invenvtory-batch-initial-quantity'
import { InventoryBatchRemainingQuantity } from './inventory-batch-remaining-quantity'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'
import { CannotDeductFromExhaustedBatchException } from './exceptions/exhaute-batch.exception'
import { InventoryBatchCreatedEvent } from './events/inventory-batch-created.event'

export interface InventoryBatchPrimitives {
  id: string
  ingredientId: string
  initialQuantity: number
  remainingQuantity: number
  unitId: string
  unitCost: number // Costo por unidad (ej: $10,000 por kg)
  currency: string
  purchaseDate: Date
  expirationDate: Date | null
  supplierId: string | null
  referenceCode: string | null // Código de factura o referencia
}

/**
 * InventoryBatch - Aggregate Root
 *
 * Representa un lote de compra de un ingrediente.
 * Este agregado es fundamental para el costeo FIFO:
 * - Se crea cuando se registra una compra
 * - Se consume (remainingQuantity disminuye) cuando se vende producto
 * - FIFO: Los lotes más antiguos se consumen primero
 *
 * Reglas de negocio:
 * - remainingQuantity nunca puede ser negativa
 * - remainingQuantity nunca puede exceder initialQuantity
 * - Un lote se considera "agotado" cuando remainingQuantity = 0
 */
export class InventoryBatch extends AggregateRoot {
  private constructor(
    public readonly id: InventoryBatchId,
    public readonly ingredientId: IngredientId,
    private readonly initialQuantity: InventoryBatchInitialQuantity,
    private remainingQuantity: InventoryBatchRemainingQuantity,
    private readonly unitId: UnitId,
    private readonly unitCost: Money, // Costo por unidad del ingrediente
    private readonly purchaseDate: Date,
    private readonly expirationDate: Date | null,
    private readonly supplierId: string | null,
    private readonly referenceCode: string | null
  ) {
    super()
    this.ensureRemainingDoesNotExceedInitial()
    this.ensureQuantitiesHaveSameUnit()
  }

  static create(
    id: string,
    ingredientId: string,
    quantity: number,
    unitId: string,
    unitCost: number,
    currency: string,
    purchaseDate: Date,
    expirationDate: Date | null = null,
    supplierId: string | null = null,
    referenceCode: string | null = null
  ): InventoryBatch {
    // const quantityVO = new Quantity(quantity, unitId)
    const batch = new InventoryBatch(
      new InventoryBatchId(id),
      new IngredientId(ingredientId),
      new InventoryBatchInitialQuantity(quantity, unitId),
      new InventoryBatchRemainingQuantity(quantity, unitId),
      new UnitId(unitId),
      new Money(unitCost, currency),
      purchaseDate,
      expirationDate,
      supplierId,
      referenceCode
    )
    batch.record(
      new InventoryBatchCreatedEvent({
        batchId: id,
        ingredientId,
        quantity,
        unitId,
        unitCost,
        currency,
        purchaseDate,
        expirationDate,
        supplierId,
        referenceCode
      })
    )
    return batch
  }

  /**
   * Deduce cantidad del lote (usado en FIFO)
   * Retorna la cantidad que efectivamente se pudo deducir
   */
  deduct(quantity: Quantity): Quantity {
    this.ensureSameUnit(quantity)
    this.ensureNotExhausted()

    // Si pedimos más de lo que queda, solo deducimos lo que hay
    const deductedAmount = quantity.isGreaterThan(this.remainingQuantity)
      ? this.remainingQuantity
      : quantity

    this.remainingQuantity = this.remainingQuantity.subtract(deductedAmount)

    return deductedAmount
  }

  /**
   * Calcula el costo total de una cantidad dada
   * Si la cantidad excede lo disponible, calcula solo sobre lo disponible
   */
  calculateCost(quantity: Quantity): Money {
    this.ensureSameUnit(quantity)

    const effectiveQuantity = quantity.isGreaterThan(this.remainingQuantity)
      ? this.remainingQuantity
      : quantity

    return this.unitCost.multiply(effectiveQuantity.value)
  }

  isExhausted(): boolean {
    return this.remainingQuantity.value === 0
  }

  canSupply(quantity: Quantity): boolean {
    this.ensureSameUnit(quantity)
    return this.remainingQuantity.isGreaterOrEqual(quantity)
  }

  getAvailableQuantity(): Quantity {
    return this.remainingQuantity
  }

  getUnitCost(): Money {
    return this.unitCost
  }

  getPurchaseDate(): Date {
    return this.purchaseDate
  }

  private ensureRemainingDoesNotExceedInitial(): void {
    if (this.remainingQuantity.isGreaterThan(this.initialQuantity)) {
      throw new InvalidArgument('Remaining quantity cannot exceed initial quantity')
    }
  }

  private ensureQuantitiesHaveSameUnit(): void {
    if (this.initialQuantity.unitId !== this.remainingQuantity.unitId) {
      throw new InvalidArgument('Initial and remaining quantities must have the same unit')
    }
  }

  private ensureSameUnit(quantity: Quantity): void {
    if (this.remainingQuantity.unitId !== quantity.unitId) {
      throw new InvalidArgument(
        `Quantity unit (${quantity.unitId}) does not match batch unit (${this.remainingQuantity.unitId})`
      )
    }
  }

  private ensureNotExhausted(): void {
    if (this.isExhausted()) {
      throw new CannotDeductFromExhaustedBatchException()
    }
  }

  toPrimitives(): InventoryBatchPrimitives {
    return {
      id: this.id.value,
      ingredientId: this.ingredientId.value,
      initialQuantity: this.initialQuantity.value,
      remainingQuantity: this.remainingQuantity.value,
      unitId: this.unitId.value,
      unitCost: this.unitCost.amount,
      currency: this.unitCost.currency,
      purchaseDate: this.purchaseDate,
      expirationDate: this.expirationDate,
      supplierId: this.supplierId,
      referenceCode: this.referenceCode
    }
  }

  static fromPrimitives(primitives: InventoryBatchPrimitives): InventoryBatch {
    return new InventoryBatch(
      new InventoryBatchId(primitives.id),
      new IngredientId(primitives.ingredientId),
      new InventoryBatchInitialQuantity(primitives.initialQuantity, primitives.unitId),
      new InventoryBatchRemainingQuantity(primitives.remainingQuantity, primitives.unitId),
      new UnitId(primitives.unitId),
      new Money(primitives.unitCost, primitives.currency),
      primitives.purchaseDate,
      primitives.expirationDate,
      primitives.supplierId,
      primitives.referenceCode
    )
  }
}

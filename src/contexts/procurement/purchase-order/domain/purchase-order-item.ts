import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { Money } from '@/shared/domain/value-objects/money'
import { Uuid } from '@/shared/domain/value-objects/uuid'
import { Entity } from '@/shared/domain/entity'
import { IngredientName } from '@/contexts/inventory/ingredient/domain/ingredient-name'
import { PurchaseOrderItemCannotBeCancelled } from './exceptions/purchase-order-item-cannot-be-cancelled.exception'

export interface PurchaseOrderItemPrimitives {
  id: string
  ingredientId: string
  ingredientName: string
  quantityRequested: number
  quantityRequestedUnitId: string
  quantityReceived: number | null
  quantityReceivedUnitId: string | null
  unitCost: number
  currency: string
  totalCost: number
  notes: string | null
  isCancelled: boolean
  cancellationReason: string | null
}

/**
 * PurchaseOrderItem - Entity
 *
 * Representa un item (línea) dentro de una orden de compra.
 * Cada item corresponde a un ingrediente específico.
 *
 * Responsabilidades:
 * - Mantener la cantidad solicitada y recibida
 * - Calcular el costo total del item
 * - Calcular la varianza entre solicitado y recibido
 */
export class PurchaseOrderItem extends Entity {
  private constructor(
    public readonly id: Uuid,
    public readonly ingredientId: IngredientId,
    public readonly ingredientName: IngredientName,
    private quantityRequested: Quantity,
    private quantityReceived: Quantity | null,
    private unitCost: Money,
    private notes: string | null,
    private isCancelled: boolean,
    private cancellationReason: string | null
  ) {
    super()
  }

  /**
   * Crea un nuevo item de orden de compra
   */
  static create(
    id: string,
    ingredientId: string,
    ingredientName: string,
    quantityRequested: number,
    unitId: string,
    unitCost: number,
    currency: string,
    notes: string | null = null
  ): PurchaseOrderItem {
    return new PurchaseOrderItem(
      new Uuid(id),
      new IngredientId(ingredientId),
      new IngredientName(ingredientName),
      new Quantity(quantityRequested, unitId),
      null, // No recibido aún
      new Money(unitCost, currency),
      notes,
      false, // No cancelado
      null // Sin razón de cancelación
    )
  }

  /**
   * Registra la recepción de este item (total o parcial)
   * Permite actualizar el costo unitario si el precio real difiere del estimado
   */
  registerReception(
    quantityReceived: number,
    unitId: string,
    unitCost?: number,
    notes?: string | null
  ): void {
    if (this.quantityReceived) {
      // Ya existe recepción previa, sumar
      const additionalQuantity = new Quantity(quantityReceived, unitId)
      this.quantityReceived = this.quantityReceived.add(additionalQuantity)
    } else {
      // Primera recepción
      this.quantityReceived = new Quantity(quantityReceived, unitId)
    }

    // Actualizar costo unitario si se proporciona (precio real vs estimado)
    if (unitCost !== undefined) {
      this.unitCost = new Money(unitCost, this.unitCost.currency)
    }

    // Actualizar notas si se proporcionan
    if (notes !== undefined) {
      this.notes = notes
    }
  }

  /**
   * Actualiza los datos del item (solo en órdenes DRAFT)
   * Permite modificar cantidad solicitada, costo unitario y notas
   */
  update(
    quantityRequested?: number,
    unitId?: string,
    unitCost?: number,
    currency?: string,
    notes?: string | null
  ): void {
    if (quantityRequested !== undefined && unitId !== undefined) {
      this.quantityRequested = new Quantity(quantityRequested, unitId)
    }

    if (unitCost !== undefined && currency !== undefined) {
      ;(this as any).unitCost = new Money(unitCost, currency)
    }

    if (notes !== undefined) {
      this.notes = notes
    }
  }

  /**
   * Actualiza las notas del item
   */
  updateNotes(notes: string | null): void {
    this.notes = notes
  }

  /**
   * Cancela el item (proveedor no pudo conseguirlo)
   */
  cancel(reason: string | null): void {
    if (this.hasBeenReceived()) {
      throw new PurchaseOrderItemCannotBeCancelled(this.id.value)
    }
    this.isCancelled = true
    this.cancellationReason = reason
  }

  /**
   * Verifica si el item ha sido procesado (recibido o cancelado)
   * Un item procesado ya no requiere acción pendiente
   */
  hasBeenProcessed(): boolean {
    return this.hasBeenReceived() || this.isCancelled
  }

  /**
   * Verifica si el item ha recibido alguna cantidad (parcial o total)
   */
  hasBeenReceived(): boolean {
    return this.quantityReceived !== null && this.quantityReceived.value > 0
  }

  /**
   * Costo total del item = unitCost * quantityRequested
   */
  get totalCost(): Money {
    return this.unitCost.multiply(this.quantityRequested.value)
  }

  /**
   * Verifica si el item ha sido completamente recibido
   */
  isFullyReceived(): boolean {
    if (!this.quantityReceived) return false

    return (
      this.quantityReceived.value >= this.quantityRequested.value &&
      this.quantityReceived.unitId === this.quantityRequested.unitId
    )
  }

  /**
   * Verifica si el item ha sido parcialmente recibido
   */
  isPartiallyReceived(): boolean {
    if (!this.quantityReceived) return false

    return (
      this.quantityReceived.value > 0 &&
      this.quantityReceived.value < this.quantityRequested.value &&
      this.quantityReceived.unitId === this.quantityRequested.unitId
    )
  }

  /**
   * Calcula la varianza entre solicitado y recibido
   * Positivo = recibimos más de lo esperado
   * Negativo = recibimos menos de lo esperado
   * Null = aún no se ha recibido
   */
  getQuantityVariance(): number | null {
    if (!this.quantityReceived) return null

    return this.quantityReceived.value - this.quantityRequested.value
  }

  /**
   * Calcula el porcentaje de varianza
   * Ejemplo: -10% significa que recibimos 10% menos de lo solicitado
   */
  getQuantityVariancePercentage(): number | null {
    const variance = this.getQuantityVariance()
    if (variance === null) return null

    return (variance / this.quantityRequested.value) * 100
  }

  /**
   * Cantidad pendiente de recibir
   */
  getPendingQuantity(): number {
    if (!this.quantityReceived) return this.quantityRequested.value

    const pending = this.quantityRequested.value - this.quantityReceived.value
    return pending > 0 ? pending : 0
  }

  // ===== Serialización =====

  toPrimitives(): PurchaseOrderItemPrimitives {
    return {
      id: this.id.value,
      ingredientId: this.ingredientId.value,
      ingredientName: this.ingredientName.value,
      quantityRequested: this.quantityRequested.value,
      quantityRequestedUnitId: this.quantityRequested.unitId,
      quantityReceived: this.quantityReceived?.value ?? null,
      quantityReceivedUnitId: this.quantityReceived?.unitId ?? null,
      unitCost: this.unitCost.amount,
      currency: this.unitCost.currency,
      totalCost: this.totalCost.amount,
      notes: this.notes,
      isCancelled: this.isCancelled,
      cancellationReason: this.cancellationReason
    }
  }

  static fromPrimitives(primitives: PurchaseOrderItemPrimitives): PurchaseOrderItem {
    const item = new PurchaseOrderItem(
      new Uuid(primitives.id),
      new IngredientId(primitives.ingredientId),
      new IngredientName(primitives.ingredientName),
      new Quantity(primitives.quantityRequested, primitives.quantityRequestedUnitId),
      null,
      new Money(primitives.unitCost, primitives.currency),
      primitives.notes,
      primitives.isCancelled,
      primitives.cancellationReason
    )

    // Restaurar cantidad recibida si existe
    if (primitives.quantityReceived !== null && primitives.quantityReceivedUnitId !== null) {
      item.quantityReceived = new Quantity(
        primitives.quantityReceived,
        primitives.quantityReceivedUnitId
      )
    }

    return item
  }
}

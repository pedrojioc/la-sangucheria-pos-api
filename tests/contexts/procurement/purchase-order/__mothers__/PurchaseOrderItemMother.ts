import {
  PurchaseOrderItem,
  PurchaseOrderItemPrimitives
} from '@/contexts/procurement/purchase-order/domain/purchase-order-item'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'
import { StringMother } from '@test/shared/__mothers__/StringMother'

export class PurchaseOrderItemMother {
  static create(params: Partial<PurchaseOrderItemPrimitives> = {}): PurchaseOrderItem {
    const primitives: PurchaseOrderItemPrimitives = {
      id: params.id ?? UuidMother.random(),
      ingredientId: params.ingredientId ?? UuidMother.random(),
      ingredientName: params.ingredientName ?? StringMother.random(),
      quantityRequested: params.quantityRequested ?? NumberMother.random(),
      quantityRequestedUnitId: params.quantityRequestedUnitId ?? UuidMother.random(),
      quantityReceived: params.quantityReceived ?? null,
      quantityReceivedUnitId: params.quantityReceivedUnitId ?? null,
      unitCost: params.unitCost ?? NumberMother.random(),
      currency: params.currency ?? 'COP',
      totalCost: params.totalCost ?? (params.unitCost ?? 10) * (params.quantityRequested ?? 5),
      notes: params.notes ?? null,
      isCancelled: false,
      cancellationReason: null
    }

    return PurchaseOrderItem.fromPrimitives(primitives)
  }

  static random(): PurchaseOrderItem {
    return this.create()
  }

  static withIngredient(ingredientId: string): PurchaseOrderItem {
    return this.create({ ingredientId })
  }

  static createPrimitive(
    params: Partial<{
      id: string
      ingredientId: string
      ingredientName: string
      quantityRequested: number
      unitId: string
      unitCost: number
      currency: string
      notes: string | null
    }> = {}
  ): {
    id: string
    ingredientId: string
    ingredientName: string
    quantityRequested: number
    unitId: string
    unitCost: number
    currency: string
    notes: string | null
  } {
    return {
      id: params.id ?? UuidMother.random(),
      ingredientId: params.ingredientId ?? UuidMother.random(),
      ingredientName: params.ingredientName ?? StringMother.random(),
      quantityRequested: params.quantityRequested ?? 10,
      unitId: params.unitId ?? UuidMother.random(),
      unitCost: params.unitCost ?? 50,
      currency: params.currency ?? 'COP',
      notes: params.notes ?? null
    }
  }

  static createPrimitives(count: number = 2): Array<{
    id: string
    ingredientId: string
    ingredientName: string
    quantityRequested: number
    unitId: string
    unitCost: number
    currency: string
    notes: string | null
  }> {
    return Array.from({ length: count }, () => this.createPrimitive())
  }
}

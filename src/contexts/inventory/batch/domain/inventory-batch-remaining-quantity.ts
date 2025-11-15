import { Quantity } from '@/shared/domain/value-objects'

export class InventoryBatchRemainingQuantity extends Quantity {
  constructor(value: number, unitId: string) {
    super(value, unitId)
  }
}

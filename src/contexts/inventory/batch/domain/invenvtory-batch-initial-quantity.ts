import { Quantity } from '@/shared/domain/value-objects'

export class InventoryBatchInitialQuantity extends Quantity {
  constructor(value: number, unitId: string) {
    super(value, unitId)
  }
}

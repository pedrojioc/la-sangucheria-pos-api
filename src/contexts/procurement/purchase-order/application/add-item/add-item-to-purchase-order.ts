import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'
import { PurchaseOrderItem } from '../../domain/purchase-order-item'

/**
 * AddItemToPurchaseOrder - Use Case
 *
 * Adds an item to an existing purchase order.
 *
 * Business Rules:
 * - Purchase order must exist
 * - Order must be in DRAFT status
 * - Item ID must be unique within the order
 *
 * Preconditions:
 * - Purchase order is in DRAFT status (enforced by aggregate)
 */
export class AddItemToPurchaseOrder {
  constructor(private readonly repository: PurchaseOrderRepository) {}

  async run(
    purchaseOrderId: string,
    itemId: string,
    ingredientId: string,
    quantityRequested: number,
    unitId: string,
    unitCost: number,
    currency: string,
    notes: string | null
  ): Promise<void> {
    const purchaseOrder = await this.repository.findById(new PurchaseOrderId(purchaseOrderId))

    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }

    const item = PurchaseOrderItem.create(
      itemId,
      ingredientId,
      quantityRequested,
      unitId,
      unitCost,
      currency,
      notes
    )

    purchaseOrder.addItems([item])

    await this.repository.save(purchaseOrder)
  }
}

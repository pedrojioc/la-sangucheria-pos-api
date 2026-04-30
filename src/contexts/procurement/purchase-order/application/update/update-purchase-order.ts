import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'
import { PurchaseOrderValidationService } from '../../domain/services/purchase-order-validation.service'

/**
 * UpdatePurchaseOrder - Use Case
 *
 * Updates a purchase order in DRAFT status.
 *
 * Business Rules:
 * - Order must be in DRAFT status to be modified
 * - Can update: supplierId, expectedDeliveryDate, notes
 * - Frontend sends complete array of items (desired final state)
 * - Domain calculates diff and synchronizes items automatically
 * - All items must use the same currency as the order
 *
 * Item Management Strategy (delegated to domain):
 * - Domain's synchronizeItems() handles the 3-way sync (remove, update, prepare adds)
 * - Application layer validates external constraints (ingredients exist)
 * - Domain's confirmAddItems() finalizes the addition after validation
 *
 * Domain Events:
 * - None (updates don't generate domain events, only state transitions do)
 */
export class UpdatePurchaseOrder {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly validationService: PurchaseOrderValidationService,
    private readonly eventBus: EventBus
  ) {}

  async run(
    purchaseOrderId: string,
    supplierId?: string,
    expectedDeliveryDate?: Date | null,
    notes?: string | null,
    items?: Array<{
      id: string
      ingredientId: string
      ingredientName: string
      quantityRequested: number
      unitId: string
      unitCost: number
      currency: string
      notes: string | null
    }>
  ): Promise<void> {
    console.log('UpdatePurchaseOrder.run:', purchaseOrderId)
    const purchaseOrder = await this.repository.findById(new PurchaseOrderId(purchaseOrderId))

    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }

    // Update general order data
    purchaseOrder.update(supplierId, expectedDeliveryDate, notes)

    // If items array is provided, synchronize items via domain
    if (items !== undefined) {
      // Domain handles: removes, updates, and prepares items to add
      const { itemsToAdd, ingredientIdsToValidate } = purchaseOrder.synchronizeItems(items)

      // Application layer validates external constraints
      if (itemsToAdd.length > 0) {
        await this.validationService.validateIngredientsExists(ingredientIdsToValidate)
        // TODO: validate units exist

        // Confirm addition after validation passes
        purchaseOrder.confirmAddItems(itemsToAdd)
      }
    }

    await this.repository.save(purchaseOrder)

    const events = purchaseOrder.pullDomainEvents()
    if (events.length > 0) {
      await this.eventBus.publish(events)
    }
  }
}

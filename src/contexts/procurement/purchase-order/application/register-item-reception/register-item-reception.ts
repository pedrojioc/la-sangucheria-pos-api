import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'
import { ReceivedItemInput } from '../../domain/purchase-order'

/**
 * RegisterItemReception - Use Case
 *
 * Registers the reception of multiple items in a purchase order in a single operation.
 *
 * Business Rules:
 * - Order must be in APPROVED or PARTIALLY_RECEIVED status
 * - All items must exist in the order
 * - Can receive partial quantities
 * - Can receive multiple times (accumulates)
 * - Order status transitions based on received items
 * - Order can only be closed if ALL items have been processed (received or cancelled)
 *
 * State Transitions:
 * APPROVED → PARTIALLY_RECEIVED (when receiving items)
 * PARTIALLY_RECEIVED → CLOSED (only if closeOrder=true AND all items processed)
 *
 * Domain Events:
 * - PurchaseOrderItemReceivedEvent (triggers inventory update via RegisterPurchase)
 *   One event per item received
 *
 * Unit Conversion:
 * This use case does NOT perform unit conversion. It passes the received
 * quantity and unit to the domain event. The inventory module (RegisterPurchase)
 * is responsible for converting to the ingredient's base unit.
 */
export class RegisterItemReception {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    purchaseOrderId: string,
    items: ReceivedItemInput[],
    notes: string | null,
    closeOrder: boolean = false,
    receivedBy: string | null = null
  ): Promise<void> {
    const purchaseOrder = await this.repository.findById(new PurchaseOrderId(purchaseOrderId))

    if (!purchaseOrder) {
      throw new Error(`Purchase order ${purchaseOrderId} not found`)
    }

    // Register reception for each item and optionally close the order
    purchaseOrder.registerBatchReception(items, notes, closeOrder, receivedBy)

    await this.repository.save(purchaseOrder)

    const events = purchaseOrder.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}

// ! Determinar por qué no hay una relación en inventory batches con la orden de compra

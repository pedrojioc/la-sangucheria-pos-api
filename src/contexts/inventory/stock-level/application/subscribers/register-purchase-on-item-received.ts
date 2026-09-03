import { DomainEventClass, DomainEventSubscriber } from '@/shared/domain/events'
import { PurchaseOrderItemReceivedEvent } from '@contexts/procurement/purchase-order/domain/events/purchase-order-item-received.event'
import { Uuid } from '@/shared/domain/value-objects/uuid'
import { RegisterPurchase } from '@contexts/inventory/batch/application/register-purchase/register-purchase'

/**
 * RegisterPurchaseOnItemReceived
 *
 * Inventory's reaction to procurement announcing a received purchase-order
 * item. This subscriber IS inventory's anti-corruption layer against
 * procurement: it consumes procurement's published event payload (primitive
 * data only) and translates it into a call to inventory's own use case. It
 * never touches a procurement domain object.
 *
 * DISPATCH CATEGORY 1 (Synchronous) — MUST be registered as such in
 * DISPATCH_CATEGORIES. Runs in-transaction with the purchase-order write.
 */
export class RegisterPurchaseOnItemReceived
  implements DomainEventSubscriber<PurchaseOrderItemReceivedEvent>
{
  constructor(private readonly registerPurchase: RegisterPurchase) {}

  subscribedTo(): DomainEventClass[] {
    return [PurchaseOrderItemReceivedEvent]
  }

  async on(event: PurchaseOrderItemReceivedEvent): Promise<void> {
    const {
      ingredientId,
      quantityReceived,
      unitId,
      unitCost,
      currency,
      receivedDate,
      supplierId,
      orderNumber
    } = event.toPrimitives()

    await this.registerPurchase.run(
      Uuid.random().value, // batchId — inventory-owned identity
      ingredientId,
      quantityReceived,
      unitId,
      unitCost,
      currency,
      receivedDate,
      null, // expirationDate — not carried by the event
      supplierId, // -> supplier
      orderNumber // -> referenceCode
    )
  }
}

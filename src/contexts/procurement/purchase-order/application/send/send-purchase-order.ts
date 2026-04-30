import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'
import { PurchaseMethod } from '../../domain/purchase-method'

/**
 * SendPurchaseOrder - Use Case
 *
 * TODO: This use case needs to be refactored.
 * The SENT status was removed from the domain model.
 * Instead, the purchaseMethod field should be used.
 *
 * The domain aggregate needs a method to register the purchase method.
 * For now, this use case is disabled.
 *
 * Options:
 * 1. Add a registerPurchaseMethod() method to the aggregate
 * 2. Register purchase method during approval
 * 3. Remove this use case entirely
 */
export class SendPurchaseOrder {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    purchaseOrderId: string,
    sentBy: string,
    purchaseMethod: PurchaseMethod,
    purchaseMethodDetails: string | null = null
  ): Promise<void> {
    throw new Error('This use case is deprecated. Use approve() with purchaseMethod instead.')

    // TODO: Implement when domain method is available
    // const purchaseOrder = await this.repository.findById(new PurchaseOrderId(purchaseOrderId))
    // if (!purchaseOrder) {
    //   throw new Error(`Purchase order ${purchaseOrderId} not found`)
    // }
    // purchaseOrder.registerPurchaseMethod(sentBy, purchaseMethod, purchaseMethodDetails)
    // await this.repository.save(purchaseOrder)
    // const events = purchaseOrder.pullDomainEvents()
    // await this.eventBus.publish(events)
  }
}

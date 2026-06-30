import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderId } from '../../domain/purchase-order-id'
import { PurchaseMethod } from '../../domain/purchase-method'
import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class OrderPurchaseOrder {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    purchaseOrderId: string,
    orderedBy: string,
    purchaseMethod: PurchaseMethod,
    purchaseMethodDetails: string | null = null
  ): Promise<void> {
    const purchaseOrder = await this.repository.findById(new PurchaseOrderId(purchaseOrderId))

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase order with id '${purchaseOrderId}' not found`)
    }

    purchaseOrder.send(orderedBy, purchaseMethod, purchaseMethodDetails)

    await this.repository.save(purchaseOrder)

    const events = purchaseOrder.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}

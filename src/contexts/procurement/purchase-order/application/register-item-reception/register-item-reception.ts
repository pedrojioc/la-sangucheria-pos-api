import { EventBus } from '@/shared/domain/events'
import { PurchaseOrderId } from '../../domain/purchase-order-id'
import { ReceivedItemInput } from '../../domain/purchase-order'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderNotFound } from '../../domain/exceptions/purchase-order-not-found.exception'

/**
 * RegisterItemReception - Use Case
 *
 * Registra la recepción de items de una orden de compra. Concierne
 * exclusivamente a purchase-order — no conoce inventory.
 *
 * TRANSACTION: this use case does NOT open a transaction. The endpoint that
 * reaches it carries @UseInterceptors(TransactionInterceptor), which opens ONE
 * transaction per request and exposes it via the ALS UnitOfWorkContext.
 * PurchaseOrderRepository (a TransactionalRepository) enlists automatically.
 *
 * EVENT PUBLICATION IS IN-TRANSACTION AND MUST STAY THAT WAY.
 * PurchaseOrderItemReceivedEvent has a category-1 (Synchronous) subscriber in
 * inventory (RegisterPurchaseOnItemReceived) that performs the inventory
 * writes. publish() is what triggers those writes, so it must run while the
 * ambient context is open. Moving publish() outside run(), or after any
 * commit, silently breaks atomicity between purchase_orders and inventory_*.
 */
export class RegisterItemReception {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    purchaseOrderId: string,
    items: ReceivedItemInput[],
    notes: string | null,
    closeOrder: boolean = false,
    receivedBy: string | null = null
  ): Promise<void> {
    const purchaseOrder = await this.purchaseOrderRepository.findById(
      new PurchaseOrderId(purchaseOrderId)
    )

    if (!purchaseOrder) {
      throw new PurchaseOrderNotFound(purchaseOrderId)
    }

    const notReceivedItems = items.filter(i => i.notReceived)
    const receivedItems = items.filter(i => !i.notReceived)

    for (const item of notReceivedItems) {
      purchaseOrder.cancelItem(item.purchaseOrderItemId, item.notes)
    }

    if (receivedItems.length > 0) {
      purchaseOrder.registerBatchReception(receivedItems, notes, closeOrder, receivedBy)
    } else if (closeOrder) {
      purchaseOrder.close(receivedBy ?? 'system')
    }

    await this.purchaseOrderRepository.save(purchaseOrder)

    // In-transaction publish. Category-1 subscribers run here, awaited,
    // on the SAME ambient manager. See class doc — do not move this.
    await this.eventBus.publish(purchaseOrder.pullDomainEvents())
  }
}

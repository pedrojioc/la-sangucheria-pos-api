import { EventBus } from '@/shared/domain/events'
import { PurchaseOrder } from '../../domain/purchase-order'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderValidationService } from '../../domain/services/purchase-order-validation.service'
import { PurchaseOrderNumber } from '../../domain/purchase-order-number'

/**
 * CreatePurchaseOrder - Use Case
 *
 * Creates a new purchase order in DRAFT status with initial items.
 *
 * Business Rules:
 * - Order is created in DRAFT status with at least one item
 * - Order can be modified while in DRAFT
 * - Order number is generated automatically by the system (PO-YYYY-NNN)
 * - All items must use the same currency as the order
 *
 * Domain Events:
 * - PurchaseOrderCreatedEvent
 */
export class CreatePurchaseOrder {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly validationService: PurchaseOrderValidationService,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    supplierId: string,
    requestedBy: string,
    currency: string,
    expectedDeliveryDate: Date | null,
    notes: string | null,
    items: Array<{
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
    const orderItems = PurchaseOrder.createOrderItems(items)

    await this.validationService.validateIngredientsExists(
      orderItems.map(item => item.ingredientId)
    )
    // TODO: validate supplier exists
    // TODO: validate units exists

    // Generate order number from backend (system-generated resource)
    const sequence = await this.repository.getNextSequenceNumber()
    const orderNumber = PurchaseOrderNumber.generate(sequence)

    const purchaseOrder = PurchaseOrder.create(
      id,
      orderNumber.value,
      supplierId,
      requestedBy,
      currency,
      expectedDeliveryDate,
      notes,
      orderItems
    )

    await this.repository.save(purchaseOrder)

    const events = purchaseOrder.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}

import {
  DispatchCategory,
  DISPATCH_CATEGORIES,
  DEFAULT_CATEGORY,
  SubscriberClass
} from '@shared/infrastructure/event-bus/dispatch-category.registry'
import { DomainEvent, DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { SetTableOccupiedOnOrderOpened } from '@contexts/orders/order/application/subscribers/set-table-occupied-on-order-opened'
import { ReleaseTableOnOrderClosed } from '@contexts/orders/order/application/subscribers/release-table-on-order-closed'
import { ReleaseTableOnOrderCancelled } from '@contexts/orders/order/application/subscribers/release-table-on-order-cancelled'
import { UpdateLifetimeValueOnOrderClosed } from '@contexts/orders/order/application/subscribers/update-lifetime-value-on-order-closed'
import { DeductIngredientsOnOrderClosed } from '@contexts/orders/order/application/subscribers/deduct-ingredients-on-order-closed'
import { CreateLoyaltyAccountOnCustomerCreated } from '@contexts/crm/loyalty/application/subscribers/create-loyalty-account-on-customer-created'
import { IssueBillingDocumentOnOrderClosed } from '@contexts/billing/invoice/application/subscribers/issue-billing-document-on-order-closed'
import { PrintKitchenTicketOnOrderSent } from '@contexts/kitchen-operations/kitchen-printer/application/subscribers/print-kitchen-ticket-on-order-sent'
import { CreateInventoryLevelOnIngredientCreated } from '@contexts/inventory/stock-level/application/subscribers/create-inventory-level-on-ingredient-created'

describe('DispatchCategory registry', () => {
  it.each([
    [SetTableOccupiedOnOrderOpened, DispatchCategory.Synchronous],
    [ReleaseTableOnOrderClosed, DispatchCategory.Synchronous],
    [ReleaseTableOnOrderCancelled, DispatchCategory.Synchronous],
    [UpdateLifetimeValueOnOrderClosed, DispatchCategory.Synchronous],
    [DeductIngredientsOnOrderClosed, DispatchCategory.Synchronous],
    [CreateLoyaltyAccountOnCustomerCreated, DispatchCategory.Synchronous],
    [IssueBillingDocumentOnOrderClosed, DispatchCategory.Deferred],
    [PrintKitchenTicketOnOrderSent, DispatchCategory.Deferred],
    [CreateInventoryLevelOnIngredientCreated, DispatchCategory.Synchronous]
  ])('classifies %p as %i', (subscriberClass, expectedCategory) => {
    expect(DISPATCH_CATEGORIES.get(subscriberClass)).toBe(expectedCategory)
  })

  it('falls back to DEFAULT_CATEGORY (Deferred) for an unregistered class', () => {
    class UnregisteredSubscriber implements DomainEventSubscriber<DomainEvent> {
      subscribedTo(): DomainEventClass[] {
        return []
      }
      on(): Promise<void> {
        return Promise.resolve()
      }
    }

    expect(DEFAULT_CATEGORY).toBe(DispatchCategory.Deferred)
    expect(DISPATCH_CATEGORIES.get(UnregisteredSubscriber as SubscriberClass)).toBeUndefined()
  })
})

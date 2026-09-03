import { DomainEvent, DomainEventSubscriber } from '@shared/domain/events'
import { SetTableOccupiedOnOrderOpened } from '@contexts/orders/order/application/subscribers/set-table-occupied-on-order-opened'
import { ReleaseTableOnOrderClosed } from '@contexts/orders/order/application/subscribers/release-table-on-order-closed'
import { ReleaseTableOnOrderCancelled } from '@contexts/orders/order/application/subscribers/release-table-on-order-cancelled'
import { UpdateLifetimeValueOnOrderClosed } from '@contexts/orders/order/application/subscribers/update-lifetime-value-on-order-closed'
import { DeductIngredientsOnOrderClosed } from '@contexts/orders/order/application/subscribers/deduct-ingredients-on-order-closed'
import { CreateLoyaltyAccountOnCustomerCreated } from '@contexts/crm/loyalty/application/subscribers/create-loyalty-account-on-customer-created'
import { IssueBillingDocumentOnOrderClosed } from '@contexts/billing/invoice/application/subscribers/issue-billing-document-on-order-closed'
import { PrintKitchenTicketOnOrderSent } from '@contexts/kitchen-operations/kitchen-printer/application/subscribers/print-kitchen-ticket-on-order-sent'
import { CreateInventoryLevelOnIngredientCreated } from '@contexts/inventory/stock-level/application/subscribers/create-inventory-level-on-ingredient-created'
import { RegisterPurchaseOnItemReceived } from '@contexts/inventory/stock-level/application/subscribers/register-purchase-on-item-received'
import { OnProductRecipeSavedUpdateStrategySubscriber } from '@contexts/menu/product/application/on-product-recipe-saved/on-product-recipe-saved-update-strategy.subscriber'

/**
 * DispatchCategory registry (design D6)
 *
 * Keyed by SUBSCRIBER CLASS, not event name — one event can legitimately
 * have both a category-1 and category-2 reaction (e.g. OrderClosedEvent
 * drives ReleaseTableOnOrderClosed (1) and IssueBillingDocumentOnOrderClosed
 * (2)); an event-keyed map cannot express that.
 *
 * category 1 (Synchronous): dispatched in-transaction, awaited, throwing.
 * category 2 (Deferred): written to the event_store outbox for the poller.
 *
 * DEFAULT_CATEGORY is Deferred so an unclassified new subscriber can never
 * take down a user-facing write path — it degrades to at-least-once async.
 *
 * Subscriber names follow the Action+On+Event convention
 * (e.g. ReleaseTableOnOrderClosed), not On{Event}{Action} or ReactOn{Event}.
 */
export enum DispatchCategory {
  Synchronous = 1,
  Deferred = 2
}

/**
 * Constructor type for any class implementing DomainEventSubscriber — the
 * DISPATCH_CATEGORIES map key. Deliberately loose on the constructor
 * parameter list (subscribers take varied DI dependencies) but precise on
 * the resulting instance shape.
 */
export type SubscriberClass = abstract new (...args: never[]) => DomainEventSubscriber<DomainEvent>

export const DISPATCH_CATEGORIES = new Map<SubscriberClass, DispatchCategory>([
  [SetTableOccupiedOnOrderOpened, DispatchCategory.Synchronous],
  [ReleaseTableOnOrderClosed, DispatchCategory.Synchronous],
  [ReleaseTableOnOrderCancelled, DispatchCategory.Synchronous],
  [UpdateLifetimeValueOnOrderClosed, DispatchCategory.Synchronous],
  [DeductIngredientsOnOrderClosed, DispatchCategory.Synchronous],
  [CreateLoyaltyAccountOnCustomerCreated, DispatchCategory.Synchronous],
  [IssueBillingDocumentOnOrderClosed, DispatchCategory.Deferred],
  [PrintKitchenTicketOnOrderSent, DispatchCategory.Deferred],
  [CreateInventoryLevelOnIngredientCreated, DispatchCategory.Synchronous],
  [RegisterPurchaseOnItemReceived, DispatchCategory.Synchronous],
  [OnProductRecipeSavedUpdateStrategySubscriber, DispatchCategory.Synchronous]
])

export const DEFAULT_CATEGORY = DispatchCategory.Deferred

import { DomainEventSubscriber, DomainEvent } from '@/shared/domain/events'
import { ReactOnIngredientCategoryCreated } from '@contexts/inventory/ingredient-category/application/subscribers/react-on-category-ingredient-created'
import { ReactOnIngredientCreated } from '@contexts/inventory/ingredient/application/subscribers/react-on-ingredient-created'

/**
 * Array centralizado de Domain Event Subscribers SIN dependencias externas.
 *
 * Subscribers que requieren dependencias de feature modules (use cases, repositories)
 * deben registrarse en su propio feature module usando OnModuleInit + EventBus.addSubscribers().
 *
 * @see InventoryBatchModule - CreateInventoryBatchOnPurchaseOrderReceived
 * @see StockLevelModule - CreateInventoryMovementOnInventoryBatchCreated, UpdateInventoryLevelOnInventoryMovementCreated
 */
export const DOMAIN_SUBSCRIBERS = [
  ReactOnIngredientCategoryCreated,
  ReactOnIngredientCreated
] as const

/**
 * Token de inyección para el array de subscribers
 */
export const IN_MEMORY_EVENT_SUBSCRIBERS = Symbol('InMemoryEventSubscribers')

/**
 * Type helper para el array de subscribers
 */
export type DomainSubscribersArray = Array<DomainEventSubscriber<DomainEvent>>

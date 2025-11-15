import { DomainEventSubscriber, DomainEvent } from '@/shared/domain/events'
import { ReactOnIngredientCategoryCreated } from '@contexts/inventory/ingredient-category/application/subscribers/react-on-category-ingredient-created'
import { ReactOnIngredientCreated } from '@contexts/inventory/ingredient/application/subscribers/react-on-ingredient-created'

// Importar todos los domain event subscribers del proyecto
// TODO: Actualizar esta lista cuando se agreguen nuevos subscribers

/**
 * Array centralizado de todos los Domain Event Subscribers
 * Agregar nuevos subscribers aquí para auto-registro
 */
export const DOMAIN_SUBSCRIBERS = [
  // Agregar nuevos subscribers aquí:
  // PaymentProcessedSubscriber,
  // InventoryUpdatedSubscriber,
  // NotificationSentSubscriber,
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

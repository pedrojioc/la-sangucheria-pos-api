import { DomainEventClass, DomainEventSubscriber } from '@/shared/domain/events'
import { IngredientCreatedEvent } from '../../domain/events/ingredient-created.event'

export class ReactOnIngredientCreated implements DomainEventSubscriber<IngredientCreatedEvent> {
  subscribedTo(): DomainEventClass[] {
    return [IngredientCreatedEvent]
  }

  async on(event: IngredientCreatedEvent): Promise<void> {
    console.log('ReactOnIngredientCreated', event)
    const payload = event.toPrimitives()
    console.log(`Ingredient created: ${payload.name} in category: ${payload.ingredientCategoryId}`)
  }
}

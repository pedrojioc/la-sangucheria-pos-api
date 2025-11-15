import { DomainEventClass, DomainEventSubscriber } from '@/shared/domain/events'
import { IngredientCategoryCreatedEvent } from '../../domain/events/ingredient-category-created.event'

export class ReactOnIngredientCategoryCreated
  implements DomainEventSubscriber<IngredientCategoryCreatedEvent>
{
  subscribedTo(): DomainEventClass[] {
    return [IngredientCategoryCreatedEvent]
  }

  async on(event: IngredientCategoryCreatedEvent): Promise<void> {
    console.log('ReactOnIngredientCategoryCreated', event)
  }
}

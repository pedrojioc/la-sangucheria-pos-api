import { DomainEventClass, DomainEventSubscriber } from '@/shared/domain/events'
import { CategoryCreatedDomainEvent } from '../../domain/events/category-created.event'

export class ReactOnCategoryCreated implements DomainEventSubscriber<CategoryCreatedDomainEvent> {
  subscribedTo(): DomainEventClass[] {
    return [CategoryCreatedDomainEvent]
  }

  async on(event: CategoryCreatedDomainEvent): Promise<void> {}
}

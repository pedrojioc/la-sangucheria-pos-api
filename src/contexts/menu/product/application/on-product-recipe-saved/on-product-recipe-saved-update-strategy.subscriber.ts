import { Injectable } from '@nestjs/common'
import { DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { ProductRecipeSavedEvent } from '@contexts/menu/product-recipe/domain/events/product-recipe-saved.event'
import { OnProductRecipeSavedUpdateStrategy } from './on-product-recipe-saved-update-strategy'

@Injectable()
export class OnProductRecipeSavedUpdateStrategySubscriber
  implements DomainEventSubscriber<ProductRecipeSavedEvent>
{
  constructor(private readonly useCase: OnProductRecipeSavedUpdateStrategy) {}

  subscribedTo(): DomainEventClass[] {
    return [ProductRecipeSavedEvent]
  }

  async on(event: ProductRecipeSavedEvent): Promise<void> {
    const { productId } = event.toPrimitives()
    await this.useCase.run(productId)
  }
}

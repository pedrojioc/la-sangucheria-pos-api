import { ProductCategoryRepository } from '../../domain/repositories/product-category.repository'
import { ProductCategoryId } from '@/contexts/menu/product-category/domain/product-category-id'
import { ProductCategoryNotExist } from '../../domain/exceptions/product-category-not-exist.exception'
import { EventBus } from '@/shared/domain/events/event-bus'

export class DeleteProductCategory {
  constructor(
    private readonly repository: ProductCategoryRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string): Promise<void> {
    const categoryId = new ProductCategoryId(id)
    const category = await this.repository.search(categoryId)

    if (!category) {
      throw new ProductCategoryNotExist(categoryId)
    }

    const events = category.pullDomainEvents()

    await this.repository.delete(categoryId)

    await this.eventBus.publish(events)
  }
}

import { ProductCategoryRepository } from '@/contexts/menu/product-category/domain/repositories/product-category.repository'
import { ProductCategoryId } from '@/contexts/menu/product-category/domain/product-category-id'
import { ProductCategoryNotExist } from '@/contexts/menu/product-category/domain/exceptions/product-category-not-exist.exception'
import { EventBus } from '@/shared/domain/events/event-bus'

export class UpdateProductCategory {
  constructor(
    private readonly repository: ProductCategoryRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    description: string | null,
    icon: string | null,
    color: string | null,
    isActive: boolean,
    displayOrder: number,
    defaultStationId: string | null = null
  ): Promise<void> {
    const categoryId = new ProductCategoryId(id)
    const category = await this.repository.search(categoryId)

    if (!category) {
      throw new ProductCategoryNotExist(categoryId)
    }

    category.update(name, description, icon, color, isActive, displayOrder, defaultStationId)

    await this.repository.save(category)

    const events = category.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}

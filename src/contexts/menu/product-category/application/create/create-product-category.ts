import { EventBus } from '@/shared/domain/events'
import { ProductCategory } from '../../domain/product-category'
import { ProductCategoryRepository } from '../../domain/repositories/product-category.repository'

export class CreateProductCategory {
  constructor(
    private readonly productCategoryRepository: ProductCategoryRepository,
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
    const productCategory = ProductCategory.create(
      id,
      name,
      description,
      icon,
      color,
      isActive,
      displayOrder,
      defaultStationId
    )

    await this.productCategoryRepository.save(productCategory)

    const events = productCategory.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}

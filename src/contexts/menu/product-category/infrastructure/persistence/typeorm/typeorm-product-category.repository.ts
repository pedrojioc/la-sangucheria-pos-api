import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { ProductCategoryEntity } from './product-category.entity'
import { ProductCategoryRepository } from '@/contexts/menu/product-category/domain/repositories/product-category.repository'
import { ProductCategory } from '@/contexts/menu/product-category/domain/product-category'
import { ProductCategoryId } from '@/contexts/menu/product-category/domain/product-category-id'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmProductCategoryRepository
  extends TransactionalRepository<ProductCategoryEntity>
  implements ProductCategoryRepository
{
  constructor(
    @InjectRepository(ProductCategoryEntity)
    repository: Repository<ProductCategoryEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(productCategory: ProductCategory): Promise<void> {
    const primitives = productCategory.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(id: ProductCategoryId): Promise<ProductCategory | null> {
    const entity = await this.repo.findOne({
      where: { id: id.value }
    })

    if (!entity) {
      return null
    }

    return ProductCategory.fromPrimitives({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      icon: entity.icon,
      color: entity.color,
      isActive: entity.isActive,
      displayOrder: entity.displayOrder,
      defaultStationId: entity.defaultStationId
    })
  }

  async searchAll(): Promise<ProductCategory[]> {
    const entities = await this.repo.find({ order: { displayOrder: 'ASC' } })
    return entities.map(entity => {
      return ProductCategory.fromPrimitives({
        id: entity.id,
        name: entity.name,
        description: entity.description,
        icon: entity.icon,
        color: entity.color,
        isActive: entity.isActive,
        displayOrder: entity.displayOrder,
        defaultStationId: entity.defaultStationId
      })
    })
  }

  async delete(id: ProductCategoryId): Promise<void> {
    await this.repo.delete({ id: id.value })
  }
}

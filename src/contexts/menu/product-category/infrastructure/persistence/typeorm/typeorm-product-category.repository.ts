import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { ProductCategoryEntity } from './product-category.entity'
import { ProductCategoryRepository } from '@/contexts/menu/product-category/domain/repositories/product-category.repository'
import { ProductCategory } from '@/contexts/menu/product-category/domain/product-category'
import { ProductCategoryId } from '@/contexts/menu/product-category/domain/product-category-id'

@Injectable()
export class TypeOrmProductCategoryRepository implements ProductCategoryRepository {
  constructor(
    @InjectRepository(ProductCategoryEntity)
    private readonly repository: Repository<ProductCategoryEntity>
  ) {}

  async save(productCategory: ProductCategory): Promise<void> {
    const primitives = productCategory.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async search(id: ProductCategoryId): Promise<ProductCategory | null> {
    const entity = await this.repository.findOne({
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
    const entities = await this.repository.find({ order: { displayOrder: 'ASC' } })
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
    await this.repository.delete({ id: id.value })
  }
}

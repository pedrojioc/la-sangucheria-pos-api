import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { IngredientCategory } from '@contexts/inventory/ingredient-category/domain/ingredient-category'
import { IngredientCategoryId } from '@contexts/inventory/ingredient-category/domain/ingredient-category-id'
import { IngredientCategoryRepository } from '@contexts/inventory/ingredient-category/domain/repositories/ingredient-category.repository'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { IngredientCategoryEntity } from './ingredient-category.entity'

@Injectable()
export class TypeOrmIngredientCategoryRepository
  extends TransactionalRepository<IngredientCategoryEntity>
  implements IngredientCategoryRepository
{
  constructor(
    @InjectRepository(IngredientCategoryEntity)
    repository: Repository<IngredientCategoryEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(ingredientCategory: IngredientCategory): Promise<void> {
    const primitives = ingredientCategory.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(id: IngredientCategoryId): Promise<IngredientCategory | null> {
    const entity = await this.repo.findOne({
      where: { id: id.value }
    })

    if (!entity) {
      return null
    }

    return IngredientCategory.fromPrimitives({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      icon: entity.icon,
      color: entity.color,
      sortOrder: entity.sortOrder,
      isActive: entity.isActive
    })
  }

  async searchAll(): Promise<IngredientCategory[]> {
    const entities = await this.repo.find({
      order: { sortOrder: 'ASC' },
      where: { isActive: true }
    })
    return entities.map(entity => {
      return IngredientCategory.fromPrimitives({
        id: entity.id,
        name: entity.name,
        description: entity.description,
        icon: entity.icon,
        color: entity.color,
        sortOrder: entity.sortOrder,
        isActive: entity.isActive
      })
    })
  }
}

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Ingredient } from '@contexts/inventory/ingredient/domain/ingredient'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { IngredientRepository } from '@contexts/inventory/ingredient/domain/repositories/ingredient.repository'
import { IngredientEntity } from './ingredient.entity'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmIngredientRepository
  extends TransactionalRepository<IngredientEntity>
  implements IngredientRepository
{
  constructor(
    @InjectRepository(IngredientEntity)
    repository: Repository<IngredientEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(ingredient: Ingredient): Promise<void> {
    const primitives = ingredient.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(id: IngredientId): Promise<Ingredient | null> {
    const entity = await this.repo.findOne({
      where: { id: id.value }
    })

    if (!entity) {
      return null
    }

    return Ingredient.fromPrimitives({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      ingredientCategoryId: entity.ingredientCategoryId,
      unitId: entity.unitId,
      preferredSupplierId: entity.preferredSupplierId,
      minimumStock: entity.minimumStock,
      maximumStock: entity.maximumStock,
      isPerishable: entity.isPerishable,
      shelfLifeDays: entity.shelfLifeDays,
      storageLocation: entity.storageLocation,
      isActive: entity.isActive
    })
  }

  async searchAll(): Promise<Ingredient[]> {
    const entities = await this.repo.find()
    return entities.map(entity => {
      return Ingredient.fromPrimitives({
        id: entity.id,
        name: entity.name,
        description: entity.description,
        ingredientCategoryId: entity.ingredientCategoryId,
        unitId: entity.unitId,
        preferredSupplierId: entity.preferredSupplierId,
        minimumStock: entity.minimumStock,
        maximumStock: entity.maximumStock,
        isPerishable: entity.isPerishable,
        shelfLifeDays: entity.shelfLifeDays,
        storageLocation: entity.storageLocation,
        isActive: entity.isActive
      })
    })
  }

  async hasTransactions(id: IngredientId): Promise<boolean> {
    const batchCount = await this.repo.manager
      .createQueryBuilder()
      .select('1')
      .from('inventory_batches', 'b')
      .where('b.ingredient_id = :id', { id: id.value })
      .limit(1)
      .getCount()

    if (batchCount > 0) return true

    const levelCount = await this.repo.manager
      .createQueryBuilder()
      .select('1')
      .from('inventory_levels', 'l')
      .where('l.ingredient_id = :id', { id: id.value })
      .limit(1)
      .getCount()

    return levelCount > 0
  }

  async matching(criteria: Criteria): Promise<PaginatedResult<Ingredient>> {
    const converter = new TypeOrmCriteriaConverter<IngredientEntity>()
    let qb = this.repo.createQueryBuilder('ingredient')
    qb.leftJoinAndSelect('ingredient.ingredientCategory', 'category')
    qb.leftJoinAndSelect('ingredient.unit', 'unit')
    qb.leftJoinAndSelect('ingredient.preferredSupplier', 'supplier')

    qb = converter.convert(qb, criteria, 'ingredient')

    const [items, total] = await qb.getManyAndCount()

    const ingredients = items.map(entity =>
      Ingredient.fromPrimitives({
        id: entity.id,
        name: entity.name,
        description: entity.description,
        ingredientCategoryId: entity.ingredientCategoryId,
        unitId: entity.unitId,
        preferredSupplierId: entity.preferredSupplierId,
        minimumStock: entity.minimumStock,
        maximumStock: entity.maximumStock,
        isPerishable: entity.isPerishable,
        shelfLifeDays: entity.shelfLifeDays,
        storageLocation: entity.storageLocation,
        isActive: entity.isActive
      })
    )

    return PaginatedResult.create(
      ingredients,
      total,
      criteria.pagination.page,
      criteria.pagination.pageSize
    )
  }
}

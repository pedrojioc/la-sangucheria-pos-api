import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, LessThan, LessThanOrEqual, Not, Repository } from 'typeorm'

import { InventoryLevelRepository } from '../../../domain/repositories/inventory-level.repository'
import { InventoryLevel } from '../../../domain/inventory-level'
import { InventoryLevelId } from '../../../domain/inventory-level-id'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { InventoryLevelEntity } from './inventory-level.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmInventoryLevelRepository
  extends TransactionalRepository<InventoryLevelEntity>
  implements InventoryLevelRepository
{
  constructor(
    @InjectRepository(InventoryLevelEntity)
    repository: Repository<InventoryLevelEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(level: InventoryLevel): Promise<void> {
    const primitives = level.toPrimitives()
    const entity = this.repo.create({
      id: primitives.id,
      ingredientId: primitives.ingredientId,
      currentQuantity: primitives.currentQuantity,
      unitId: primitives.unitId,
      minimumQuantity: primitives.minimumQuantity ?? 0,
      maximumQuantity: primitives.maximumQuantity,
      reorderPoint: primitives.reorderPoint
    })
    await this.repo.save(entity)
  }

  async search(id: InventoryLevelId): Promise<InventoryLevel | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return InventoryLevel.fromPrimitives(this.mapEntityToPrimitives(entity))
  }

  async findByIngredient(ingredientId: IngredientId): Promise<InventoryLevel | null> {
    const entity = await this.repo.findOne({
      where: { ingredientId: ingredientId.value }
    })
    if (!entity) return null
    return InventoryLevel.fromPrimitives(this.mapEntityToPrimitives(entity))
  }

  async findLowStock(): Promise<InventoryLevel[]> {
    const entities = await this.repo
      .createQueryBuilder('level')
      .where('level.current_quantity < level.minimum_quantity')
      .andWhere('level.current_quantity > 0')
      .getMany()

    return entities.map(entity => InventoryLevel.fromPrimitives(this.mapEntityToPrimitives(entity)))
  }

  async findBelowReorderPoint(): Promise<InventoryLevel[]> {
    const entities = await this.repo
      .createQueryBuilder('level')
      .where('level.reorder_point IS NOT NULL')
      .andWhere('level.current_quantity <= level.reorder_point')
      .getMany()

    return entities.map(entity => InventoryLevel.fromPrimitives(this.mapEntityToPrimitives(entity)))
  }

  async findOutOfStock(): Promise<InventoryLevel[]> {
    const entities = await this.repo.find({
      where: { currentQuantity: 0 }
    })
    return entities.map(entity => InventoryLevel.fromPrimitives(this.mapEntityToPrimitives(entity)))
  }

  async searchAll(): Promise<InventoryLevel[]> {
    const entities = await this.repo.find()
    return entities.map(entity => InventoryLevel.fromPrimitives(this.mapEntityToPrimitives(entity)))
  }

  private mapEntityToPrimitives(entity: InventoryLevelEntity) {
    return {
      id: entity.id,
      ingredientId: entity.ingredientId,
      currentQuantity: Number(entity.currentQuantity),
      unitId: entity.unitId,
      minimumQuantity: entity.minimumQuantity !== null ? Number(entity.minimumQuantity) : null,
      maximumQuantity: entity.maximumQuantity !== null ? Number(entity.maximumQuantity) : null,
      reorderPoint: entity.reorderPoint !== null ? Number(entity.reorderPoint) : null
    }
  }
}

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { InventoryMovementRepository } from '../../../domain/repositories/inventory-movement.repository'
import { InventoryMovement } from '../../../domain/inventory-movement'
import { InventoryMovementId } from '../../../domain/inventory-movement-id'
import { IngredientId } from '@/contexts/inventory/ingredient/domain/ingredient-id'
import { MovementType } from '../../../domain/movement-type'
import { InventoryMovementEntity } from './inventory-movement.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmInventoryMovementRepository
  extends TransactionalRepository<InventoryMovementEntity>
  implements InventoryMovementRepository
{
  constructor(
    @InjectRepository(InventoryMovementEntity)
    repository: Repository<InventoryMovementEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(movement: InventoryMovement): Promise<void> {
    const primitives = movement.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(id: InventoryMovementId): Promise<InventoryMovement | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return InventoryMovement.fromPrimitives(this.mapEntityToPrimitives(entity))
  }

  async findByIngredient(ingredientId: IngredientId): Promise<InventoryMovement[]> {
    const entities = await this.repo.find({
      where: { ingredientId: ingredientId.value },
      order: { performedAt: 'DESC' }
    })
    return entities.map(entity =>
      InventoryMovement.fromPrimitives(this.mapEntityToPrimitives(entity))
    )
  }

  async findByType(type: MovementType): Promise<InventoryMovement[]> {
    const entities = await this.repo.find({
      where: { type },
      order: { performedAt: 'DESC' }
    })
    return entities.map(entity =>
      InventoryMovement.fromPrimitives(this.mapEntityToPrimitives(entity))
    )
  }

  async findByReference(referenceId: string): Promise<InventoryMovement[]> {
    const entities = await this.repo.find({
      where: { referenceId },
      order: { performedAt: 'DESC' }
    })
    return entities.map(entity =>
      InventoryMovement.fromPrimitives(this.mapEntityToPrimitives(entity))
    )
  }

  async searchAll(): Promise<InventoryMovement[]> {
    const entities = await this.repo.find({
      order: { performedAt: 'DESC' }
    })
    return entities.map(entity =>
      InventoryMovement.fromPrimitives(this.mapEntityToPrimitives(entity))
    )
  }

  private mapEntityToPrimitives(entity: InventoryMovementEntity) {
    return {
      id: entity.id,
      ingredientId: entity.ingredientId,
      batchId: entity.batchId,
      type: entity.type,
      quantity: Number(entity.quantity),
      unitId: entity.unitId,
      unitCost: Number(entity.unitCost),
      currency: entity.currency,
      totalCost: Number(entity.totalCost),
      reason: entity.reason,
      referenceId: entity.referenceId,
      performedBy: entity.performedBy,
      performedAt: entity.performedAt
    }
  }
}

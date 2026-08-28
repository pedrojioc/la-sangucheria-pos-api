import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchId } from '@contexts/inventory/batch/domain/inventory-batch-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { InventoryBatchEntity } from './inventory-batch.entity'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmInventoryBatchRepository
  extends TransactionalRepository<InventoryBatchEntity>
  implements InventoryBatchRepository
{
  constructor(
    @InjectRepository(InventoryBatchEntity)
    repository: Repository<InventoryBatchEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(batch: InventoryBatch): Promise<void> {
    const primitives = batch.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(id: InventoryBatchId): Promise<InventoryBatch | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return InventoryBatch.fromPrimitives(entity)
  }

  async findAvailableByIngredient(ingredientId: IngredientId): Promise<InventoryBatch[]> {
    const entities = await this.repo.find({
      where: {
        ingredientId: ingredientId.value
      },
      order: {
        purchaseDate: 'ASC' // FIFO: Más antiguo primero
      }
    })

    // Filtrar solo los que tienen stock disponible
    return entities
      .map(entity => InventoryBatch.fromPrimitives(entity))
      .filter(batch => !batch.isExhausted())
  }

  async findByIngredient(ingredientId: IngredientId): Promise<InventoryBatch[]> {
    const entities = await this.repo.find({
      where: {
        ingredientId: ingredientId.value
      },
      order: {
        purchaseDate: 'DESC' // Más reciente primero para vista general
      }
    })

    return entities.map(entity => InventoryBatch.fromPrimitives(entity))
  }

  async searchAll(): Promise<InventoryBatch[]> {
    const entities = await this.repo.find({
      order: {
        createdAt: 'DESC'
      }
    })

    return entities.map(entity => InventoryBatch.fromPrimitives(entity))
  }
}

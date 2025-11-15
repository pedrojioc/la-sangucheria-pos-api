import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchId } from '@contexts/inventory/batch/domain/inventory-batch-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { InventoryBatchEntity } from './inventory-batch.entity'

@Injectable()
export class TypeOrmInventoryBatchRepository extends InventoryBatchRepository {
  constructor(
    @InjectRepository(InventoryBatchEntity)
    private readonly repository: Repository<InventoryBatchEntity>
  ) {
    super()
  }

  async save(batch: InventoryBatch): Promise<void> {
    const primitives = batch.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async search(id: InventoryBatchId): Promise<InventoryBatch | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    if (!entity) return null
    return InventoryBatch.fromPrimitives(entity)
  }

  async findAvailableByIngredient(ingredientId: IngredientId): Promise<InventoryBatch[]> {
    const entities = await this.repository.find({
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
    const entities = await this.repository.find({
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
    const entities = await this.repository.find({
      order: {
        createdAt: 'DESC'
      }
    })

    return entities.map(entity => InventoryBatch.fromPrimitives(entity))
  }
}

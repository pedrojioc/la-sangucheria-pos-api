import { Injectable } from '@nestjs/common'
import { DataSource, EntityManager } from 'typeorm'
import { PurchaseUnitOfWork } from '@contexts/inventory/batch/domain/purchase-unit-of-work'
import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchId } from '@contexts/inventory/batch/domain/inventory-batch-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { InventoryBatchEntity } from './inventory-batch.entity'
import { InventoryMovement } from '@contexts/inventory/stock-level/domain/inventory-movement'
import { InventoryMovementId } from '@contexts/inventory/stock-level/domain/inventory-movement-id'
import { MovementType } from '@contexts/inventory/stock-level/domain/movement-type'
import { InventoryMovementEntity } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-movement.entity'
import { InventoryLevel } from '@contexts/inventory/stock-level/domain/inventory-level'
import { InventoryLevelId } from '@contexts/inventory/stock-level/domain/inventory-level-id'
import { InventoryLevelEntity } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-level.entity'

@Injectable()
export class TypeOrmPurchaseUnitOfWork extends PurchaseUnitOfWork {
  private _manager: EntityManager | null = null

  constructor(private readonly dataSource: DataSource) {
    super()
  }

  get batchRepository(): InventoryBatchRepository {
    return this.buildBatchRepository(this.requireManager())
  }

  get movementRepository(): InventoryMovementRepository {
    return this.buildMovementRepository(this.requireManager())
  }

  get levelRepository(): InventoryLevelRepository {
    return this.buildLevelRepository(this.requireManager())
  }

  async commit(work: (uow: PurchaseUnitOfWork) => Promise<void>): Promise<void> {
    await this.dataSource.transaction(async (manager: EntityManager) => {
      this._manager = manager
      try {
        await work(this)
      } finally {
        this._manager = null
      }
    })
  }

  private requireManager(): EntityManager {
    if (!this._manager) {
      throw new Error('PurchaseUnitOfWork: repositories can only be accessed inside commit()')
    }
    return this._manager
  }

  private buildBatchRepository(manager: EntityManager): InventoryBatchRepository {
    const repo = manager.getRepository(InventoryBatchEntity)

    return new (class extends InventoryBatchRepository {
      async save(batch: InventoryBatch): Promise<void> {
        const p = batch.toPrimitives()
        await repo.save({
          id: p.id,
          ingredientId: p.ingredientId,
          initialQuantity: p.initialQuantity,
          remainingQuantity: p.remainingQuantity,
          unitId: p.unitId,
          unitCost: p.unitCost,
          currency: p.currency,
          purchaseDate: p.purchaseDate,
          expirationDate: p.expirationDate,
          supplierId: p.supplierId,
          referenceCode: p.referenceCode
        })
      }

      async search(id: InventoryBatchId): Promise<InventoryBatch | null> {
        const entity = await repo.findOne({ where: { id: id.value } })
        return entity ? InventoryBatch.fromPrimitives(entity) : null
      }

      async findAvailableByIngredient(ingredientId: IngredientId): Promise<InventoryBatch[]> {
        const entities = await repo.find({
          where: { ingredientId: ingredientId.value },
          order: { purchaseDate: 'ASC' }
        })
        return entities.map(e => InventoryBatch.fromPrimitives(e)).filter(b => !b.isExhausted())
      }

      async findByIngredient(ingredientId: IngredientId): Promise<InventoryBatch[]> {
        const entities = await repo.find({
          where: { ingredientId: ingredientId.value },
          order: { purchaseDate: 'DESC' }
        })
        return entities.map(e => InventoryBatch.fromPrimitives(e))
      }

      async searchAll(): Promise<InventoryBatch[]> {
        const entities = await repo.find({ order: { createdAt: 'DESC' } })
        return entities.map(e => InventoryBatch.fromPrimitives(e))
      }
    })()
  }

  private buildMovementRepository(manager: EntityManager): InventoryMovementRepository {
    const repo = manager.getRepository(InventoryMovementEntity)

    return new (class extends InventoryMovementRepository {
      async save(movement: InventoryMovement): Promise<void> {
        await repo.save(movement.toPrimitives())
      }

      async search(id: InventoryMovementId): Promise<InventoryMovement | null> {
        const entity = await repo.findOne({ where: { id: id.value } })
        if (!entity) return null
        return InventoryMovement.fromPrimitives({
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
        })
      }

      async findByIngredient(_ingredientId: IngredientId): Promise<InventoryMovement[]> {
        return []
      }

      async findByType(_type: MovementType): Promise<InventoryMovement[]> {
        return []
      }

      async findByReference(_referenceId: string): Promise<InventoryMovement[]> {
        return []
      }

      async searchAll(): Promise<InventoryMovement[]> {
        return []
      }
    })()
  }

  private buildLevelRepository(manager: EntityManager): InventoryLevelRepository {
    const repo = manager.getRepository(InventoryLevelEntity)

    return new (class extends InventoryLevelRepository {
      async save(level: InventoryLevel): Promise<void> {
        const p = level.toPrimitives()
        await repo.save({
          id: p.id,
          ingredientId: p.ingredientId,
          currentQuantity: p.currentQuantity,
          unitId: p.unitId,
          minimumQuantity: p.minimumQuantity ?? 0,
          maximumQuantity: p.maximumQuantity,
          reorderPoint: p.reorderPoint
        })
      }

      async search(id: InventoryLevelId): Promise<InventoryLevel | null> {
        const entity = await repo.findOne({ where: { id: id.value } })
        if (!entity) return null
        return InventoryLevel.fromPrimitives({
          id: entity.id,
          ingredientId: entity.ingredientId,
          currentQuantity: Number(entity.currentQuantity),
          unitId: entity.unitId,
          minimumQuantity: entity.minimumQuantity !== null ? Number(entity.minimumQuantity) : null,
          maximumQuantity: entity.maximumQuantity !== null ? Number(entity.maximumQuantity) : null,
          reorderPoint: entity.reorderPoint !== null ? Number(entity.reorderPoint) : null
        })
      }

      async findByIngredient(ingredientId: IngredientId): Promise<InventoryLevel | null> {
        const entity = await repo.findOne({ where: { ingredientId: ingredientId.value } })
        if (!entity) return null
        return InventoryLevel.fromPrimitives({
          id: entity.id,
          ingredientId: entity.ingredientId,
          currentQuantity: Number(entity.currentQuantity),
          unitId: entity.unitId,
          minimumQuantity: entity.minimumQuantity !== null ? Number(entity.minimumQuantity) : null,
          maximumQuantity: entity.maximumQuantity !== null ? Number(entity.maximumQuantity) : null,
          reorderPoint: entity.reorderPoint !== null ? Number(entity.reorderPoint) : null
        })
      }

      async findLowStock(): Promise<InventoryLevel[]> {
        return []
      }

      async findBelowReorderPoint(): Promise<InventoryLevel[]> {
        return []
      }

      async findOutOfStock(): Promise<InventoryLevel[]> {
        return []
      }

      async searchAll(): Promise<InventoryLevel[]> {
        return []
      }
    })()
  }
}

import { Injectable } from '@nestjs/common'
import { DataSource, EntityManager } from 'typeorm'
import { ReceptionUnitOfWork } from '@contexts/procurement/purchase-order/domain/reception-unit-of-work'
import { PurchaseOrderRepository } from '@contexts/procurement/purchase-order/domain/repositories/purchase-order.repository'
import {
  PurchaseOrder,
  PurchaseOrderPrimitives
} from '@contexts/procurement/purchase-order/domain/purchase-order'
import { PurchaseOrderId } from '@contexts/procurement/purchase-order/domain/purchase-order-id'
import { PurchaseOrderStatus } from '@contexts/procurement/purchase-order/domain/purchase-order-status'
import { PurchaseOrderEntity } from './purchase-order.entity'
import { PurchaseOrderItemEntity } from './purchase-order-item.entity'
import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryBatchId } from '@contexts/inventory/batch/domain/inventory-batch-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { InventoryBatchEntity } from '@contexts/inventory/batch/infrastructure/persistence/typeorm/inventory-batch.entity'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryMovement } from '@contexts/inventory/stock-level/domain/inventory-movement'
import { InventoryMovementId } from '@contexts/inventory/stock-level/domain/inventory-movement-id'
import { MovementType } from '@contexts/inventory/stock-level/domain/movement-type'
import { InventoryMovementEntity } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-movement.entity'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'
import { InventoryLevel } from '@contexts/inventory/stock-level/domain/inventory-level'
import { InventoryLevelId } from '@contexts/inventory/stock-level/domain/inventory-level-id'
import { InventoryLevelEntity } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-level.entity'

@Injectable()
export class TypeOrmReceptionUnitOfWork extends ReceptionUnitOfWork {
  private _manager: EntityManager | null = null

  constructor(private readonly dataSource: DataSource) {
    super()
  }

  get purchaseOrderRepository(): PurchaseOrderRepository {
    return this.buildPurchaseOrderRepository(this.requireManager())
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

  async commit(work: (uow: ReceptionUnitOfWork) => Promise<void>): Promise<void> {
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
      throw new Error('ReceptionUnitOfWork: repositories can only be accessed inside commit()')
    }
    return this._manager
  }

  private buildPurchaseOrderRepository(manager: EntityManager): PurchaseOrderRepository {
    const repo = manager.getRepository(PurchaseOrderEntity)
    const itemRepo = manager.getRepository(PurchaseOrderItemEntity)

    return new (class extends PurchaseOrderRepository {
      async save(purchaseOrder: PurchaseOrder): Promise<void> {
        const p = purchaseOrder.toPrimitives()

        await repo.save({
          id: p.id,
          orderNumber: p.orderNumber,
          supplierId: p.supplierId,
          status: p.status,
          requestedBy: p.requestedBy,
          approvedBy: p.approvedBy,
          rejectedBy: p.rejectedBy,
          sentBy: p.sentBy,
          receivedBy: p.receivedBy,
          closedBy: p.closedBy,
          purchaseMethod: p.purchaseMethod,
          purchaseMethodDetails: p.purchaseMethodDetails,
          totalAmount: p.totalAmount,
          currency: p.currency,
          requestedDate: p.requestedDate,
          expectedDeliveryDate: p.expectedDeliveryDate,
          approvedDate: p.approvedDate,
          sentDate: p.sentDate,
          receivedDate: p.receivedDate,
          rejectedDate: p.rejectedDate,
          cancelledDate: p.cancelledDate,
          closedDate: p.closedDate,
          notes: p.notes,
          itemCount: p.itemCount
        })

        const currentItemIds = p.items.map(i => i.id)
        if (currentItemIds.length > 0) {
          await itemRepo
            .createQueryBuilder()
            .delete()
            .where('purchase_order_id = :id', { id: p.id })
            .andWhere('id NOT IN (:...ids)', { ids: currentItemIds })
            .execute()
        }

        if (p.items.length > 0) {
          await itemRepo.save(
            p.items.map(item => ({
              id: item.id,
              purchaseOrderId: p.id,
              ingredientId: item.ingredientId,
              quantityRequested: item.quantityRequested,
              quantityRequestedUnitId: item.quantityRequestedUnitId,
              quantityReceived: item.quantityReceived,
              quantityReceivedUnitId: item.quantityReceivedUnitId,
              unitCost: item.unitCost,
              totalCost: item.totalCost,
              currency: item.currency,
              notes: item.notes,
              isCancelled: item.isCancelled,
              cancellationReason: item.cancellationReason
            }))
          )
        }
      }

      async findById(id: PurchaseOrderId): Promise<PurchaseOrder | null> {
        const entity = await repo.findOne({
          where: { id: id.value },
          relations: {
            items: { ingredient: true, quantityRequestedUnit: true, quantityReceivedUnit: true }
          }
        })
        if (!entity) return null
        return toDomain(entity)
      }

      async findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null> {
        const entity = await repo.findOne({
          where: { orderNumber },
          relations: { items: { ingredient: true } }
        })
        if (!entity) return null
        return toDomain(entity)
      }

      async findByStatus(status: PurchaseOrderStatus): Promise<PurchaseOrder[]> {
        const entities = await repo.find({
          where: { status },
          relations: { items: { ingredient: true } }
        })
        return entities.map(toDomain)
      }

      async getNextSequenceNumber(): Promise<number> {
        const count = await repo.count()
        return count + 1
      }
    })()

    function toDomain(entity: PurchaseOrderEntity): PurchaseOrder {
      const primitives: PurchaseOrderPrimitives = {
        id: entity.id,
        orderNumber: entity.orderNumber,
        supplierId: entity.supplierId,
        status: entity.status as PurchaseOrderStatus,
        items: (entity.items ?? []).map(item => ({
          id: item.id,
          ingredientId: item.ingredientId,
          ingredientName: item.ingredient?.name ?? '',
          quantityRequested: Number(item.quantityRequested),
          quantityRequestedUnitId: item.quantityRequestedUnitId,
          quantityReceived: item.quantityReceived ? Number(item.quantityReceived) : null,
          quantityReceivedUnitId: item.quantityReceivedUnitId,
          unitCost: Number(item.unitCost),
          currency: item.currency,
          totalCost: Number(item.totalCost),
          notes: item.notes,
          isCancelled: item.isCancelled,
          cancellationReason: item.cancellationReason
        })),
        itemCount: entity.itemCount,
        requestedBy: entity.requestedBy,
        submittedBy: entity.submittedBy,
        approvedBy: entity.approvedBy,
        rejectedBy: entity.rejectedBy,
        sentBy: entity.sentBy,
        cancelledBy: entity.cancelledBy,
        receivedBy: entity.receivedBy,
        closedBy: entity.closedBy,
        purchaseMethod: entity.purchaseMethod,
        purchaseMethodDetails: entity.purchaseMethodDetails,
        totalAmount: Number(entity.totalAmount),
        currency: entity.currency,
        requestedDate: entity.requestedDate,
        expectedDeliveryDate: entity.expectedDeliveryDate,
        submittedDate: entity.submittedDate,
        approvedDate: entity.approvedDate,
        sentDate: entity.sentDate,
        receivedDate: entity.receivedDate,
        rejectedDate: entity.rejectedDate,
        cancelledDate: entity.cancelledDate,
        closedDate: entity.closedDate,
        notes: entity.notes
      }
      return PurchaseOrder.fromPrimitives(primitives)
    }
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

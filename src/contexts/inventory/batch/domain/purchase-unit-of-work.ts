import { InventoryBatchRepository } from './repositories/inventory-batch.repository'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'

export abstract class PurchaseUnitOfWork {
  abstract get batchRepository(): InventoryBatchRepository
  abstract get movementRepository(): InventoryMovementRepository
  abstract get levelRepository(): InventoryLevelRepository

  abstract commit(work: (uow: PurchaseUnitOfWork) => Promise<void>): Promise<void>
}

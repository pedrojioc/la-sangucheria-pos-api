import { PurchaseOrderRepository } from './repositories/purchase-order.repository'
import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'

export abstract class ReceptionUnitOfWork {
  abstract get purchaseOrderRepository(): PurchaseOrderRepository
  abstract get batchRepository(): InventoryBatchRepository
  abstract get movementRepository(): InventoryMovementRepository
  abstract get levelRepository(): InventoryLevelRepository

  abstract commit(work: (uow: ReceptionUnitOfWork) => Promise<void>): Promise<void>
}

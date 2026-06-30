import { IngredientTransformationRepository } from './repositories/ingredient-transformation.repository'
import { InventoryBatchRepository } from '@contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { InventoryMovementRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-movement.repository'
import { InventoryLevelRepository } from '@contexts/inventory/stock-level/domain/repositories/inventory-level.repository'

export abstract class TransformationUnitOfWork {
  abstract get batchRepository(): InventoryBatchRepository
  abstract get movementRepository(): InventoryMovementRepository
  abstract get levelRepository(): InventoryLevelRepository
  abstract get transformationRepository(): IngredientTransformationRepository

  abstract commit(work: (uow: TransformationUnitOfWork) => Promise<void>): Promise<void>
}

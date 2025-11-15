import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'

export abstract class PurchaseOrderValidationService {
  abstract validateIngredientsExists(ingredientIds: IngredientId[]): Promise<void>

  abstract validateSupplierExists(supplierId: string): Promise<void>

  abstract validateUnitsExist(unitIds: string[]): Promise<void>
}

import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { Ingredient } from '../ingredient'
import { IngredientId } from '../ingredient-id'

export abstract class IngredientRepository {
  abstract save(ingredient: Ingredient): Promise<void>

  abstract search(id: IngredientId): Promise<Ingredient | null>

  abstract searchAll(): Promise<Ingredient[]>

  abstract matching(criteria: Criteria): Promise<PaginatedResult<Ingredient>>

  /**
   * Returns true if the ingredient has any inventory transactions (batches or stock-level).
   *
   * Used to guard unit-of-measure changes: once an ingredient has transactions its unit
   * is considered immutable (same policy as SAP B1 / NetSuite). If this returns true,
   * UpdateIngredient will reject a unitId change.
   *
   * Future path to Option B (multi-UoM): replace this guard with a conversion-factor
   * migration that normalises all existing quantities to the new base unit before saving.
   */
  abstract hasTransactions(id: IngredientId): Promise<boolean>
}

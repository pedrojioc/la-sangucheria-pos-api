import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { Ingredient } from '../ingredient'
import { IngredientId } from '../ingredient-id'

export abstract class IngredientRepository {
  abstract save(ingredient: Ingredient): Promise<void>

  abstract search(id: IngredientId): Promise<Ingredient | null>

  abstract searchAll(): Promise<Ingredient[]>

  abstract matching(criteria: Criteria): Promise<PaginatedResult<Ingredient>>
}

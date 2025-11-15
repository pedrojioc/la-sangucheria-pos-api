import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { IngredientRepository } from '../../domain/repositories/ingredient.repository'
import { Ingredient } from '../../domain/ingredient'

export class SearchIngredientsByCriteria {
  constructor(private readonly ingredientRepository: IngredientRepository) {}

  async run(criteria: Criteria): Promise<PaginatedResult<Ingredient>> {
    return this.ingredientRepository.matching(criteria)
  }
}

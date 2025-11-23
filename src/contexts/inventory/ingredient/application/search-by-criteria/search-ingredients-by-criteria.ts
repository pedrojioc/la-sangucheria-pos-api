import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { IngredientRepository } from '../../domain/repositories/ingredient.repository'
import { Ingredient } from '../../domain/ingredient'

export class SearchIngredientsByCriteria {
  constructor(private readonly ingredientRepository: IngredientRepository) {}

  async run(
    page: number,
    pageSize: number,
    filters: Array<{ field: string; operator: string; value: any }>,
    orderBy: string | null,
    orderType: string | null
  ): Promise<PaginatedResult<Ingredient>> {
    const criteria = Criteria.fromPrimitives({
      page,
      pageSize,
      filters,
      orderBy,
      orderType
    })
    return this.ingredientRepository.matching(criteria)
  }
}

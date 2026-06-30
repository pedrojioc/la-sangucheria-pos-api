import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { IngredientCategoryQueryService } from '../services/ingredient-category-query.service'
import { IngredientCategoryListItem } from '../dto/ingredient-category-list-item'

export class SearchIngredientCategoriesByCriteria {
  constructor(private readonly queryService: IngredientCategoryQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<IngredientCategoryListItem>> {
    return this.queryService.search(criteria)
  }
}

import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { IngredientQueryService } from '../services/ingredient-query.service'
import { IngredientListItem } from '../dto/ingredient-list-item'

export class SearchIngredientsByCriteria {
  constructor(private readonly queryService: IngredientQueryService) {}

  run(criteria: Criteria): Promise<PaginatedResult<IngredientListItem>> {
    return this.queryService.search(criteria)
  }
}

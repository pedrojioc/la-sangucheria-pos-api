import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { PreparationRecipeQueryService } from '../services/preparation-recipe-query.service'
import { PreparationRecipeListItem } from '../dto/preparation-recipe-list-item'

export class SearchPreparationRecipesByCriteria {
  constructor(private readonly queryService: PreparationRecipeQueryService) {}

  async run(criteria: Criteria): Promise<PaginatedResult<PreparationRecipeListItem>> {
    return this.queryService.search(criteria)
  }
}

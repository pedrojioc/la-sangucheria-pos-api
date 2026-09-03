import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { PreparationRecipeListItemResponse } from './preparation-recipe-list-item.response'

export class PaginatedPreparationRecipeListResponse {
  constructor(
    public readonly data: PreparationRecipeListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}

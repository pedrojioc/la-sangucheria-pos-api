import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { PreparationRecipeListItemResponse } from '../../presentation/http/dto/preparation-recipe-list-item.response'

export class PaginatedPreparationRecipeListResponse {
  constructor(
    public readonly data: PreparationRecipeListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}

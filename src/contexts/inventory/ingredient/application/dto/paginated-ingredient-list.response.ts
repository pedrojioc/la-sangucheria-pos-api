import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { IngredientListItemResponse } from './ingredient-list-item.response'

export class PaginatedIngredientListResponse {
  constructor(
    public readonly data: IngredientListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}

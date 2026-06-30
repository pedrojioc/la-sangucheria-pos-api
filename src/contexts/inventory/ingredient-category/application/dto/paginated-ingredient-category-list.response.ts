import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { IngredientCategoryListItemResponse } from './ingredient-category-list-item.response'

export class PaginatedIngredientCategoryListResponse {
  constructor(
    public readonly data: IngredientCategoryListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}

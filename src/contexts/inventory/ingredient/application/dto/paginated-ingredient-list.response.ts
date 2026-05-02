import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { IngredientListItemResponse } from '../../presentation/http/dto/ingredient-list-item.response'

export class PaginatedIngredientListResponse {
  constructor(
    public readonly data: IngredientListItemResponse[],
    public readonly meta: PaginationMeta
  ) {}
}

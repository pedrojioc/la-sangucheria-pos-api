import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { IngredientResponse } from './ingredient.response'

export class PaginatedIngredientListResponse {
  constructor(
    public readonly data: IngredientResponse[],
    public readonly meta: PaginationMeta
  ) {}
}

import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { IngredientListItem } from '../dto/ingredient-list-item'

export abstract class IngredientQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<IngredientListItem>>
}

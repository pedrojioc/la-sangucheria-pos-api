import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { IngredientCategoryListItem } from '../dto/ingredient-category-list-item'

export abstract class IngredientCategoryQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<IngredientCategoryListItem>>
}

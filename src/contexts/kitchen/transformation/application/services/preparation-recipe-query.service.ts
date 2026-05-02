import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { PreparationRecipeListItem } from '../dto/preparation-recipe-list-item'

export abstract class PreparationRecipeQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<PreparationRecipeListItem>>
}

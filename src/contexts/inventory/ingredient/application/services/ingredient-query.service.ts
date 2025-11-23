import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { IngredientWithDetailsDto } from '../dto/ingredient-with-details.dto'

export abstract class IngredientQueryService {
  abstract searchWithDetails(criteria: Criteria): Promise<PaginatedResult<IngredientWithDetailsDto>>
}

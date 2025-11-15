import { Criteria } from '@/shared/domain/criteria/criteria'

export class SearchIngredientsByCriteriaQuery {
  constructor(public readonly criteria: Criteria) {}
}

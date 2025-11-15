import { Criteria } from '@/shared/domain/criteria/criteria'

export class SearchProductsByCriteriaQuery {
  constructor(public readonly criteria: Criteria) {}
}

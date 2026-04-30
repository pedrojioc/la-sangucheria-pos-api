import { Criteria } from '@/shared/domain/criteria/criteria'

export class SearchEmployeesByCriteriaQuery {
  constructor(public readonly criteria: Criteria) {}
}

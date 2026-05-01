import { Criteria } from '@/shared/domain/criteria/criteria'

export class SearchCustomersByCriteriaQuery {
  constructor(public readonly criteria: Criteria) {}
}

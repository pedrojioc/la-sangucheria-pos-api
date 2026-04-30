import { Criteria } from '@/shared/domain/criteria/criteria'

export class SearchUsersByCriteriaQuery {
  constructor(public readonly criteria: Criteria) {}
}

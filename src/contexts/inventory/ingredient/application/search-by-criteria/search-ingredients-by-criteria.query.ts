import { Criteria } from '@/shared/domain/criteria/criteria'

export class SearchIngredientsByCriteriaQuery {
  constructor(
    public readonly page: number,
    public readonly pageSize: number,
    public readonly filters: Array<{ field: string; operator: string; value: any }>,
    public readonly orderBy: string | null,
    public readonly orderType: string | null
  ) {}
}

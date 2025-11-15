import { Filters } from './filters'
import { Order } from './order'
import { Pagination } from './pagination'

export class Criteria {
  constructor(
    public readonly filters: Filters,
    public readonly order: Order,
    public readonly pagination: Pagination
  ) {}

  static fromPrimitives(plain: {
    filters?: Array<{ field: string; operator: string; value: any }>
    orderBy?: string
    orderType?: string
    page?: number
    pageSize?: number
  }): Criteria {
    return new Criteria(
      plain.filters && plain.filters.length > 0
        ? Filters.fromPrimitives(plain.filters)
        : Filters.none(),
      plain.orderBy
        ? Order.fromPrimitives({
            orderBy: plain.orderBy,
            orderType: plain.orderType || 'asc'
          })
        : Order.none(),
      Pagination.fromPrimitives(plain.page, plain.pageSize)
    )
  }

  static create(filters: Filters, order: Order, pagination: Pagination): Criteria {
    return new Criteria(filters, order, pagination)
  }

  hasFilters(): boolean {
    return this.filters.hasFilters()
  }
}

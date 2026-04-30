import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindPurchaseOrdersByStatusQuery } from './find-by-status.query'
import { FindPurchaseOrdersByStatus } from './find-by-status'
import { PurchaseOrderListItemResponse } from '../dto/purchase-order-list-item.response'

@QueryHandler(FindPurchaseOrdersByStatusQuery)
export class FindPurchaseOrdersByStatusHandler
  implements IQueryHandler<FindPurchaseOrdersByStatusQuery>
{
  constructor(private readonly useCase: FindPurchaseOrdersByStatus) {}

  async execute(query: FindPurchaseOrdersByStatusQuery): Promise<PurchaseOrderListItemResponse[]> {
    const items = await this.useCase.run(query.status)
    return items.map(item => PurchaseOrderListItemResponse.fromReadModel(item))
  }
}

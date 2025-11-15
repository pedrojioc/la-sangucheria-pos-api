import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindPurchaseOrdersByStatusQuery } from './find-by-status.query'
import { FindPurchaseOrdersByStatus } from './find-by-status'
import { PurchaseOrderListResponse } from '../dto/purchase-order-list.response'

@QueryHandler(FindPurchaseOrdersByStatusQuery)
export class FindPurchaseOrdersByStatusHandler
  implements IQueryHandler<FindPurchaseOrdersByStatusQuery>
{
  constructor(private readonly useCase: FindPurchaseOrdersByStatus) {}

  async execute(query: FindPurchaseOrdersByStatusQuery): Promise<PurchaseOrderListResponse> {
    const purchaseOrders = await this.useCase.run(query.status)
    return PurchaseOrderListResponse.fromDomain(purchaseOrders)
  }
}

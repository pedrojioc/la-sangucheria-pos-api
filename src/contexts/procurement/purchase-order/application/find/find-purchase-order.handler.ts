import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindPurchaseOrderQuery } from './find-purchase-order.query'
import { FindPurchaseOrder } from './find-purchase-order'
import { PurchaseOrderResponse } from '../dto/purchase-order.response'

@QueryHandler(FindPurchaseOrderQuery)
export class FindPurchaseOrderHandler implements IQueryHandler<FindPurchaseOrderQuery> {
  constructor(private readonly useCase: FindPurchaseOrder) {}

  async execute(query: FindPurchaseOrderQuery): Promise<PurchaseOrderResponse | null> {
    const readModel = await this.useCase.run(query.id)

    if (!readModel) {
      return null
    }

    return PurchaseOrderResponse.fromReadModel(readModel)
  }
}

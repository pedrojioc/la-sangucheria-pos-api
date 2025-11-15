import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { ConvertQuantityQuery } from './convert-quantity.query'
import { ConvertQuantity } from './convert-quantity'
import { Quantity } from '@/shared/domain/value-objects/quantity'

@QueryHandler(ConvertQuantityQuery)
export class ConvertQuantityHandler
  implements IQueryHandler<ConvertQuantityQuery, Quantity>
{
  constructor(private readonly useCase: ConvertQuantity) {}

  async execute(query: ConvertQuantityQuery): Promise<Quantity> {
    return this.useCase.run(query.quantity, query.fromUnitId, query.toUnitId)
  }
}

import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindUnitConversionsQuery } from './find-unit-conversions.query'
import { FindUnitConversions } from './find-unit-conversions'
import { UnitConversionListItemResponse } from '../../presentation/http/dto/unit-conversion-list-item.response'

@QueryHandler(FindUnitConversionsQuery)
export class FindUnitConversionsQueryHandler
  implements IQueryHandler<FindUnitConversionsQuery, UnitConversionListItemResponse[]>
{
  constructor(private readonly useCase: FindUnitConversions) {}

  async execute(query: FindUnitConversionsQuery): Promise<UnitConversionListItemResponse[]> {
    const items = await this.useCase.run(query.unitId)
    return items.map(UnitConversionListItemResponse.fromReadModel)
  }
}

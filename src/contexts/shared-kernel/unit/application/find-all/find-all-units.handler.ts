import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindAllUnitsQuery } from './find-all-units.query'
import { FindAllUnits } from './find-all-units'
import { UnitListResponse } from '../dto/unit-list.response'

@QueryHandler(FindAllUnitsQuery)
export class FindAllUnitsQueryHandler
  implements IQueryHandler<FindAllUnitsQuery, UnitListResponse>
{
  constructor(private readonly useCase: FindAllUnits) {}

  async execute(): Promise<UnitListResponse> {
    const units = await this.useCase.run()
    return UnitListResponse.fromDomain(units)
  }
}

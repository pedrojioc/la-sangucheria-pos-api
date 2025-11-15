import { QueryHandler, IQueryHandler } from '@nestjs/cqrs'
import { FindUnitQuery } from './find-unit.query'
import { FindUnit } from './find-unit'
import { UnitResponse } from '../dto/unit.response'
import { Query } from '@/shared/application/bus/query'

@QueryHandler(FindUnitQuery)
export class FindUnitQueryHandler implements IQueryHandler<FindUnitQuery, UnitResponse> {
  constructor(private readonly useCase: FindUnit) {}

  subscribedTo(): Query {
    return FindUnitQuery
  }

  async execute(query: FindUnitQuery): Promise<UnitResponse> {
    const unit = await this.useCase.run(query.id)
    return UnitResponse.fromDomain(unit)
  }
}

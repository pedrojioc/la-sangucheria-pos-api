import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindAllPositionsQuery } from './find-all-positions.query'
import { FindAllPositions } from './find-all-positions'
import { PositionResponse } from '../dto/position.response'

@QueryHandler(FindAllPositionsQuery)
export class FindAllPositionsHandler implements IQueryHandler<FindAllPositionsQuery> {
  constructor(private readonly findAllPositions: FindAllPositions) {}

  async execute(): Promise<PositionResponse[]> {
    const positions = await this.findAllPositions.run()
    return positions.map(PositionResponse.fromDomain)
  }
}

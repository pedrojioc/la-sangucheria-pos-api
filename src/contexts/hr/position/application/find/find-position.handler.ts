import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindPositionQuery } from './find-position.query'
import { FindPosition } from './find-position'
import { PositionResponse } from '../dto/position.response'

@QueryHandler(FindPositionQuery)
export class FindPositionHandler implements IQueryHandler<FindPositionQuery> {
  constructor(private readonly findPosition: FindPosition) {}

  async execute(query: FindPositionQuery): Promise<PositionResponse> {
    const position = await this.findPosition.run(query.id)
    return PositionResponse.fromDomain(position)
  }
}

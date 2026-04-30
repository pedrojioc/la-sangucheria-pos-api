import { Position } from '../../domain/position'
import { PositionRepository } from '../../domain/repositories/position.repository'
import { PositionId } from '../../domain/position-id'
import { PositionNotExist } from '../../domain/exceptions/position-not-exist.exception'

export class FindPosition {
  constructor(private readonly repository: PositionRepository) {}

  async run(id: string): Promise<Position> {
    const position = await this.repository.search(new PositionId(id))
    if (!position) throw new PositionNotExist(id)
    return position
  }
}

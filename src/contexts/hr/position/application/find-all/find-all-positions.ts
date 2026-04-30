import { Position } from '../../domain/position'
import { PositionRepository } from '../../domain/repositories/position.repository'

export class FindAllPositions {
  constructor(private readonly repository: PositionRepository) {}

  async run(): Promise<Position[]> {
    return this.repository.searchAll()
  }
}

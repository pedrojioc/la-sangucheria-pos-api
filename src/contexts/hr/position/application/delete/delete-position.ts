import { PositionRepository } from '../../domain/repositories/position.repository'
import { PositionId } from '../../domain/position-id'
import { PositionNotExist } from '../../domain/exceptions/position-not-exist.exception'

export class DeletePosition {
  constructor(private readonly repository: PositionRepository) {}

  async run(id: string): Promise<void> {
    const position = await this.repository.search(new PositionId(id))
    if (!position) throw new PositionNotExist(id)
    await this.repository.delete(new PositionId(id))
  }
}

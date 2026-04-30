import { PositionRepository } from '../../domain/repositories/position.repository'
import { PositionId } from '../../domain/position-id'
import { PositionNotExist } from '../../domain/exceptions/position-not-exist.exception'

export class UpdatePosition {
  constructor(private readonly repository: PositionRepository) {}

  async run(id: string, name: string, description: string | null, color: string | null, icon: string | null): Promise<void> {
    const position = await this.repository.search(new PositionId(id))
    if (!position) throw new PositionNotExist(id)
    position.update(name, description, color, icon)
    await this.repository.save(position)
  }
}

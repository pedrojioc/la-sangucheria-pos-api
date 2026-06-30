import { Position } from '../../domain/position'
import { PositionRepository } from '../../domain/repositories/position.repository'

export class CreatePosition {
  constructor(private readonly repository: PositionRepository) {}

  async run(
    id: string,
    name: string,
    description: string | null,
    color: string | null,
    icon: string | null
  ): Promise<void> {
    const position = Position.create(id, name, description, color, icon)
    await this.repository.save(position)
  }
}

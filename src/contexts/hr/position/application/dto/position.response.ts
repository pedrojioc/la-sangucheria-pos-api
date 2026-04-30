import { Position } from '../../domain/position'

export class PositionResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly color: string | null,
    public readonly icon: string | null
  ) {}

  static fromDomain(position: Position): PositionResponse {
    const p = position.toPrimitives()
    return new PositionResponse(p.id, p.name, p.description, p.color, p.icon)
  }
}

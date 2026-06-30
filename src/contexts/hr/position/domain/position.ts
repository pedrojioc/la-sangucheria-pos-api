import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { PositionId } from './position-id'
import { PositionName } from './position-name'

export interface PositionPrimitives {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
}

export class Position extends AggregateRoot {
  private constructor(
    public readonly id: PositionId,
    private name: PositionName,
    private description: string | null,
    private color: string | null,
    private icon: string | null
  ) {
    super()
  }

  static create(
    id: string,
    name: string,
    description: string | null,
    color: string | null,
    icon: string | null
  ): Position {
    return Position.fromPrimitives({ id, name, description, color, icon })
  }

  static fromPrimitives(primitives: PositionPrimitives): Position {
    return new Position(
      new PositionId(primitives.id),
      new PositionName(primitives.name),
      primitives.description,
      primitives.color,
      primitives.icon
    )
  }

  update(
    name: string,
    description: string | null,
    color: string | null,
    icon: string | null
  ): void {
    this.name = new PositionName(name)
    this.description = description
    this.color = color
    this.icon = icon
  }

  toPrimitives(): PositionPrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      description: this.description,
      color: this.color,
      icon: this.icon
    }
  }
}

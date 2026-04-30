import { Position } from '../position'
import { PositionId } from '../position-id'

export abstract class PositionRepository {
  abstract save(position: Position): Promise<void>
  abstract search(id: PositionId): Promise<Position | null>
  abstract searchAll(): Promise<Position[]>
  abstract delete(id: PositionId): Promise<void>
}

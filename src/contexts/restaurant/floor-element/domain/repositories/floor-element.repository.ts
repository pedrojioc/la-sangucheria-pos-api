import { FloorElement } from '../floor-element'
import { FloorElementId } from '../floor-element-id'

export abstract class FloorElementRepository {
  abstract save(element: FloorElement): Promise<void>
  abstract search(id: FloorElementId): Promise<FloorElement | null>
  abstract searchAll(): Promise<FloorElement[]>
  abstract searchAllByZone(zoneId: string): Promise<FloorElement[]>
  abstract delete(id: FloorElementId): Promise<void>
}

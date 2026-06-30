import { Station } from '../station'
import { StationId } from '../station-id'

export abstract class StationRepository {
  abstract save(station: Station): Promise<void>
  abstract delete(id: StationId): Promise<void>
  abstract search(id: StationId): Promise<Station | null>
  abstract searchByName(name: string): Promise<Station | null>
  abstract searchAll(): Promise<Station[]>
}

import { Zone } from '../zone'
import { ZoneId } from '../zone-id'

export abstract class ZoneRepository {
  abstract save(zone: Zone): Promise<void>
  abstract search(id: ZoneId): Promise<Zone | null>
  abstract searchByName(name: string): Promise<Zone | null>
  abstract searchAll(): Promise<Zone[]>
}

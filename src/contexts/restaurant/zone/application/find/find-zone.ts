import { ZoneRepository } from '../../domain/repositories/zone.repository'
import { ZoneId } from '../../domain/zone-id'
import { Zone } from '../../domain/zone'
import { ZoneNotExist } from '../../domain/exceptions/zone-not-exist.exception'

export class FindZone {
  constructor(private readonly repository: ZoneRepository) {}

  async run(id: string): Promise<Zone> {
    const zone = await this.repository.search(new ZoneId(id))
    if (!zone) throw new ZoneNotExist(id)
    return zone
  }
}

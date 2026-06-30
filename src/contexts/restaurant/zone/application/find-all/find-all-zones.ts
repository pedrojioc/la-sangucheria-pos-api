import { ZoneRepository } from '../../domain/repositories/zone.repository'
import { Zone } from '../../domain/zone'

export class FindAllZones {
  constructor(private readonly repository: ZoneRepository) {}

  async run(): Promise<Zone[]> {
    return this.repository.searchAll()
  }
}

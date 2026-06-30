import { StationRepository } from '../../domain/repositories/station.repository'
import { Station } from '../../domain/station'

export class FindAllStations {
  constructor(private readonly repository: StationRepository) {}

  async run(): Promise<Station[]> {
    return this.repository.searchAll()
  }
}

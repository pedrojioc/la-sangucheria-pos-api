import { StationRepository } from '../../domain/repositories/station.repository'
import { StationId } from '../../domain/station-id'
import { Station } from '../../domain/station'
import { StationNotExist } from '../../domain/exceptions/station-not-exist.exception'

export class FindStation {
  constructor(private readonly repository: StationRepository) {}

  async run(id: string): Promise<Station> {
    const station = await this.repository.search(new StationId(id))
    if (!station) throw new StationNotExist(id)
    return station
  }
}

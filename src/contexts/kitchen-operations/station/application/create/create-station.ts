import { StationRepository } from '../../domain/repositories/station.repository'
import { EventBus } from '@shared/domain/events'
import { Station, CreateStationParams } from '../../domain/station'
import { StationNameAlreadyExists } from '../../domain/exceptions/station-name-already-exists.exception'

export class CreateStation {
  constructor(
    private readonly repository: StationRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(params: CreateStationParams): Promise<void> {
    const existing = await this.repository.searchByName(params.name)
    if (existing) throw new StationNameAlreadyExists(params.name)

    const station = Station.create(params)
    await this.repository.save(station)
    await this.eventBus.publish(station.pullDomainEvents())
  }
}

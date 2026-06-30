import { StationRepository } from '../../domain/repositories/station.repository'
import { EventBus } from '@shared/domain/events'
import { FindStation } from '../find/find-station'
import { UpdateStationParams } from '../../domain/station'
import { StationNameAlreadyExists } from '../../domain/exceptions/station-name-already-exists.exception'

export class UpdateStation {
  constructor(
    private readonly repository: StationRepository,
    private readonly eventBus: EventBus,
    private readonly findStation: FindStation
  ) {}

  async run(id: string, params: UpdateStationParams): Promise<void> {
    const existing = await this.findStation.run(id)

    if (existing.getName() !== params.name) {
      const conflict = await this.repository.searchByName(params.name)
      if (conflict) throw new StationNameAlreadyExists(params.name)
    }

    const updated = existing.update(params)
    await this.repository.save(updated)
    await this.eventBus.publish(updated.pullDomainEvents())
  }
}

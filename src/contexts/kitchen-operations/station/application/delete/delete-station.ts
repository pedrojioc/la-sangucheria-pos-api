import { StationRepository } from '../../domain/repositories/station.repository'
import { StationId } from '../../domain/station-id'
import { StationNotExist } from '../../domain/exceptions/station-not-exist.exception'
import { EventBus } from '@shared/domain/events'

export class DeleteStation {
  constructor(
    private readonly repository: StationRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string): Promise<void> {
    const stationId = new StationId(id)
    const station = await this.repository.search(stationId)
    if (!station) throw new StationNotExist(id)

    const primitives = station.toPrimitives()
    const updated = station.update({
      name: primitives.name,
      displayOrder: primitives.displayOrder,
      isActive: false,
      color: primitives.color,
      outputDevice: primitives.outputDevice,
      printerAddress: primitives.printerAddress
    })
    await this.repository.save(updated)
    await this.eventBus.publish(updated.pullDomainEvents())
  }
}

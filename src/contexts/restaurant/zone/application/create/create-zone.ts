import { ZoneRepository } from '../../domain/repositories/zone.repository'
import { EventBus } from '@shared/domain/events'
import { Zone } from '../../domain/zone'
import { ZoneNameAlreadyExists } from '../../domain/exceptions/zone-name-already-exists.exception'

export class CreateZone {
  constructor(
    private readonly repository: ZoneRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string, name: string, color: string, sortIndex: number): Promise<void> {
    const existing = await this.repository.searchByName(name)
    if (existing) throw new ZoneNameAlreadyExists(name)

    const zone = Zone.create(id, name, color, sortIndex)
    await this.repository.save(zone)
    await this.eventBus.publish(zone.pullDomainEvents())
  }
}

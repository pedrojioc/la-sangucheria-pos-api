import { ZoneRepository } from '../../domain/repositories/zone.repository'
import { EventBus } from '@shared/domain/events'
import { FindZone } from '../find/find-zone'
import { ZoneNameAlreadyExists } from '../../domain/exceptions/zone-name-already-exists.exception'

export class UpdateZone {
  constructor(
    private readonly repository: ZoneRepository,
    private readonly eventBus: EventBus,
    private readonly findZone: FindZone
  ) {}

  async run(
    id: string,
    name: string,
    color: string,
    sortIndex: number,
    isActive: boolean
  ): Promise<void> {
    const existing = await this.findZone.run(id)

    if (existing.getName() !== name) {
      const conflict = await this.repository.searchByName(name)
      if (conflict) throw new ZoneNameAlreadyExists(name)
    }

    const updated = existing.update(name, color, sortIndex, isActive)
    await this.repository.save(updated)
    await this.eventBus.publish(updated.pullDomainEvents())
  }
}

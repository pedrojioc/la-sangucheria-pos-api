import { UnitRepository } from '../../domain/repositories/unit.repository'
import { EventBus } from '@/shared/domain/events/event-bus'
import { UnitId } from '../../domain/unit-id'
import { UnitNotExist } from '../../domain/exceptions/unit-not-exist.exception'

export class DeleteUnit {
  constructor(
    private readonly repository: UnitRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string): Promise<void> {
    const unitId = new UnitId(id)
    const unit = await this.repository.findById(unitId)

    if (!unit) {
      throw new UnitNotExist(id)
    }

    unit.delete()

    const events = unit.pullDomainEvents()

    await this.repository.delete(unitId)

    await this.eventBus.publish(events)
  }
}

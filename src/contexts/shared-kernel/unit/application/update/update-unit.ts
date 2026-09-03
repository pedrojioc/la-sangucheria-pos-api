import { UnitRepository } from '../../domain/repositories/unit.repository'
import { EventBus } from '@/shared/domain/events/event-bus'
import { UnitId } from '../../domain/unit-id'
import { UnitNotExist } from '../../domain/exceptions/unit-not-exist.exception'
import { UnitTypeEnum } from '../../domain/unit-type'

export class UpdateUnit {
  constructor(
    private readonly repository: UnitRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    symbol: string,
    type: UnitTypeEnum,
    isActive: boolean
  ): Promise<void> {
    const unitId = new UnitId(id)
    const unit = await this.repository.findById(unitId)

    if (!unit) {
      throw new UnitNotExist(id)
    }

    unit.update(name, symbol, type, isActive)

    await this.repository.save(unit)

    const events = unit.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}

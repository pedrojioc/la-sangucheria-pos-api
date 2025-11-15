import { UnitRepository } from '../../domain/repositories/unit.repository'
import { EventBus } from '@/shared/domain/events/event-bus'
import { Unit } from '../../domain/unit'
import { UnitTypeEnum } from '../../domain/unit-type'

export class CreateUnit {
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
    const unit = Unit.create(id, name, symbol, type, isActive)

    await this.repository.save(unit)

    const events = unit.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}

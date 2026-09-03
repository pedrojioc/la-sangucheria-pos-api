import { UpdateUnit } from '@/contexts/shared-kernel/unit/application/update/update-unit'
import { UnitRepository } from '@/contexts/shared-kernel/unit/domain/repositories/unit.repository'
import { UnitNotExist } from '@/contexts/shared-kernel/unit/domain/exceptions/unit-not-exist.exception'
import { UnitUpdatedEvent } from '@/contexts/shared-kernel/unit/domain/events/unit-updated.event'
import { EventBus } from '@/shared/domain/events'
import { UnitTypeEnum } from '@/contexts/shared-kernel/unit/domain/unit-type'
import { UnitMother } from '../__mothers__/unit.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('UpdateUnit', () => {
  let useCase: UpdateUnit
  let repository: jest.Mocked<UnitRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    } as any
    eventBus = { publish: jest.fn() } as any
    useCase = new UpdateUnit(repository, eventBus)
  })

  it('should update the unit and save it', async () => {
    const unit = UnitMother.kilogram()
    repository.findById.mockResolvedValue(unit)

    await useCase.run(unit.toPrimitives().id, 'Gram', 'g', UnitTypeEnum.WEIGHT, true)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0]
    expect(saved.toPrimitives().name).toBe('Gram')
    expect(saved.toPrimitives().symbol).toBe('g')
  })

  it('should publish UnitUpdatedEvent', async () => {
    const unit = UnitMother.kilogram()
    repository.findById.mockResolvedValue(unit)

    await useCase.run(unit.toPrimitives().id, 'Gram', 'g', UnitTypeEnum.WEIGHT, true)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events[0]).toBeInstanceOf(UnitUpdatedEvent)
  })

  it('should throw UnitNotExist when unit does not exist', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(
      useCase.run(UuidMother.random(), 'Gram', 'g', UnitTypeEnum.WEIGHT, true)
    ).rejects.toThrow(UnitNotExist)

    expect(repository.save).not.toHaveBeenCalled()
  })
})

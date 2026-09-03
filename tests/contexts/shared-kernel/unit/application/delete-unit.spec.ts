import { DeleteUnit } from '@/contexts/shared-kernel/unit/application/delete/delete-unit'
import { UnitRepository } from '@/contexts/shared-kernel/unit/domain/repositories/unit.repository'
import { UnitNotExist } from '@/contexts/shared-kernel/unit/domain/exceptions/unit-not-exist.exception'
import { UnitDeletedEvent } from '@/contexts/shared-kernel/unit/domain/events/unit-deleted.event'
import { EventBus } from '@/shared/domain/events'
import { UnitMother } from '../__mothers__/unit.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('DeleteUnit', () => {
  let useCase: DeleteUnit
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
    useCase = new DeleteUnit(repository, eventBus)
  })

  it('should delete the unit and publish UnitDeletedEvent', async () => {
    const unit = UnitMother.kilogram()
    repository.findById.mockResolvedValue(unit)

    await useCase.run(unit.toPrimitives().id)

    expect(repository.delete).toHaveBeenCalledTimes(1)
    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events[0]).toBeInstanceOf(UnitDeletedEvent)
  })

  it('should throw UnitNotExist when unit does not exist', async () => {
    repository.findById.mockResolvedValue(null)

    await expect(useCase.run(UuidMother.random())).rejects.toThrow(UnitNotExist)

    expect(repository.delete).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })
})

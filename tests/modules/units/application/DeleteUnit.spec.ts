import { DeleteUnit } from '@contexts/shared-kernel/unit/application/delete/delete-unit'
import { UnitRepository } from '@contexts/shared-kernel/unit/domain/repositories/unit.repository'
import { EventBus } from '@/shared/domain/events/event-bus'
import { UnitDeletedEvent } from '@contexts/shared-kernel/unit/domain/events/unit-deleted.event'
import { UnitNotExist } from '@contexts/shared-kernel/unit/domain/exceptions/unit-not-exist'
import { UnitMother } from '../__mothers__/UnitMother'

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
    }

    eventBus = {
      publish: jest.fn()
    } as unknown as jest.Mocked<EventBus>

    useCase = new DeleteUnit(repository, eventBus)
  })

  it('should delete a unit', async () => {
    const unit = UnitMother.kilogram()
    repository.findById.mockResolvedValue(unit)

    await useCase.execute(unit.id.value)

    expect(repository.delete).toHaveBeenCalledTimes(1)
    expect(repository.delete).toHaveBeenCalledWith(unit.id)
  })

  it('should publish UnitDeletedEvent', async () => {
    const unit = UnitMother.liter()
    repository.findById.mockResolvedValue(unit)

    await useCase.execute(unit.id.value)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = (eventBus.publish as jest.Mock).mock.calls[0][0]
    expect(events).toHaveLength(1)
    expect(events[0]).toBeInstanceOf(UnitDeletedEvent)
    expect(events[0].aggregateId).toBe(unit.id.value)
  })

  it('should throw error when unit does not exist', async () => {
    repository.findById.mockResolvedValue(null)

    const id = 'non-existent-id'

    await expect(useCase.execute(id)).rejects.toThrow(UnitNotExist)
  })
})

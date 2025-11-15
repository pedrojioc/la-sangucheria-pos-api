import { UpdateUnit } from '@contexts/shared-kernel/unit/application/update/update-unit'
import { UnitRepository } from '@contexts/shared-kernel/unit/domain/repositories/unit.repository'
import { EventBus } from '@/shared/domain/events/event-bus'
import { UnitUpdatedEvent } from '@contexts/shared-kernel/unit/domain/events/unit-updated.event'
import { UnitNotExist } from '@contexts/shared-kernel/unit/domain/exceptions/unit-not-exist'
import { UnitTypeEnum } from '@contexts/shared-kernel/unit/domain/unit-type'
import { UnitMother } from '../__mothers__/UnitMother'

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
    }

    eventBus = {
      publish: jest.fn()
    } as unknown as jest.Mocked<EventBus>

    useCase = new UpdateUnit(repository, eventBus)
  })

  it('should update a unit', async () => {
    const unit = UnitMother.kilogram()
    repository.findById.mockResolvedValue(unit)

    const newName = 'Gram'
    const newSymbol = 'g'
    const newType = UnitTypeEnum.WEIGHT
    const newIsActive = false

    await useCase.execute(unit.id.value, newName, newSymbol, newType, newIsActive)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const savedUnit = (repository.save as jest.Mock).mock.calls[0][0]
    expect(savedUnit.toPrimitives().name).toBe(newName)
    expect(savedUnit.toPrimitives().symbol).toBe(newSymbol)
    expect(savedUnit.toPrimitives().type).toBe(newType)
    expect(savedUnit.toPrimitives().isActive).toBe(newIsActive)
  })

  it('should publish UnitUpdatedEvent', async () => {
    const unit = UnitMother.liter()
    repository.findById.mockResolvedValue(unit)

    const newName = 'Milliliter'
    const newSymbol = 'ml'
    const newType = UnitTypeEnum.VOLUME
    const newIsActive = true

    await useCase.execute(unit.id.value, newName, newSymbol, newType, newIsActive)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = (eventBus.publish as jest.Mock).mock.calls[0][0]
    expect(events).toHaveLength(1)
    expect(events[0]).toBeInstanceOf(UnitUpdatedEvent)
    expect(events[0].name).toBe(newName)
  })

  it('should throw error when unit does not exist', async () => {
    repository.findById.mockResolvedValue(null)

    const id = 'non-existent-id'

    await expect(
      useCase.execute(id, 'Name', 'symbol', UnitTypeEnum.WEIGHT, true)
    ).rejects.toThrow(UnitNotExist)
  })
})

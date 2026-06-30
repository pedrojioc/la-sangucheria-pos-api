import { CreateUnit } from '@/contexts/shared-kernel/unit/application/create/create-unit'
import { UnitRepository } from '@/contexts/shared-kernel/unit/domain/repositories/unit.repository'
import { Unit } from '@/contexts/shared-kernel/unit/domain/unit'
import { UnitCreatedEvent } from '@/contexts/shared-kernel/unit/domain/events/unit-created.event'
import { EventBus } from '@/shared/domain/events'
import { UnitTypeEnum } from '@/contexts/shared-kernel/unit/domain/unit-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('CreateUnit', () => {
  let useCase: CreateUnit
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
    useCase = new CreateUnit(repository, eventBus)
  })

  it('should save a new unit', async () => {
    const id = UuidMother.random()

    await useCase.run(id, 'Kilogram', 'kg', UnitTypeEnum.WEIGHT, true)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as Unit
    const p = saved.toPrimitives()
    expect(p.id).toBe(id)
    expect(p.name).toBe('Kilogram')
    expect(p.symbol).toBe('kg')
    expect(p.type).toBe(UnitTypeEnum.WEIGHT)
    expect(p.isActive).toBe(true)
  })

  it('should publish UnitCreatedEvent', async () => {
    await useCase.run(UuidMother.random(), 'Liter', 'l', UnitTypeEnum.VOLUME, true)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events).toHaveLength(1)
    expect(events[0]).toBeInstanceOf(UnitCreatedEvent)
    expect(events[0].eventName).toBe('unit.created')
  })

  it('should create an inactive unit', async () => {
    await useCase.run(UuidMother.random(), 'Deprecated', 'dep', UnitTypeEnum.UNIT, false)

    const saved = repository.save.mock.calls[0][0] as Unit
    expect(saved.toPrimitives().isActive).toBe(false)
  })
})

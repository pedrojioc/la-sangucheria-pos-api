import { CreateTable } from '@contexts/restaurant/table/application/create/create-table'
import { TableRepository } from '@contexts/restaurant/table/domain/repositories/table.repository'
import { EventBus } from '@shared/domain/events'
import { TableNumberAlreadyExists } from '@contexts/restaurant/table/domain/exceptions/table-number-already-exists.exception'
import { TableCreatedEvent } from '@contexts/restaurant/table/domain/events/table-created.event'
import { TableShape } from '@contexts/restaurant/table/domain/table-shape'
import { TableMother } from '../__mothers__/table.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('CreateTable', () => {
  let useCase: CreateTable
  let repository: jest.Mocked<TableRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchByNumber: jest.fn().mockResolvedValue(null),
      searchAll: jest.fn()
    } as jest.Mocked<TableRepository>

    eventBus = { publish: jest.fn() } as any

    useCase = new CreateTable(repository, eventBus)
  })

  it('should create a table when number is unique', async () => {
    const id = UuidMother.random()
    await useCase.run(id, '3', 4, TableShape.SQUARE)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0]
    const p = saved.toPrimitives()
    expect(p.id).toBe(id)
    expect(p.number).toBe('3')
    expect(p.capacity).toBe(4)
  })

  it('should publish TableCreatedEvent', async () => {
    await useCase.run(UuidMother.random(), '4', 2, TableShape.SQUARE)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events[0]).toBeInstanceOf(TableCreatedEvent)
  })

  it('should throw TableNumberAlreadyExists when number is taken', async () => {
    repository.searchByNumber.mockResolvedValue(TableMother.withNumber('5'))

    await expect(useCase.run(UuidMother.random(), '5', 4, TableShape.SQUARE)).rejects.toThrow(
      TableNumberAlreadyExists
    )
    expect(repository.save).not.toHaveBeenCalled()
  })
})

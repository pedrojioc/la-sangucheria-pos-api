import { ChangeTableStatus } from '@contexts/restaurant/table/application/change-status/change-table-status'
import { FindTable } from '@contexts/restaurant/table/application/find/find-table'
import { TableRepository } from '@contexts/restaurant/table/domain/repositories/table.repository'
import { EventBus } from '@shared/domain/events'
import { TableStatus } from '@contexts/restaurant/table/domain/table-status'
import { TableOccupied } from '@contexts/restaurant/table/domain/exceptions/table-occupied.exception'
import { TableStatusChangedEvent } from '@contexts/restaurant/table/domain/events/table-status-changed.event'
import { TableMother } from '../__mothers__/table.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('ChangeTableStatus', () => {
  let useCase: ChangeTableStatus
  let repository: jest.Mocked<TableRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchByNumber: jest.fn(),
      searchAll: jest.fn()
    } as jest.Mocked<TableRepository>

    eventBus = { publish: jest.fn() } as any
    const findTable = new FindTable(repository)
    useCase = new ChangeTableStatus(repository, eventBus, findTable)
  })

  it('should change status from AVAILABLE to RESERVED', async () => {
    const table = TableMother.available()
    repository.search.mockResolvedValue(table)

    await useCase.run(table.id.value, TableStatus.RESERVED)

    expect(repository.save).toHaveBeenCalledTimes(1)
  })

  it('should publish TableStatusChangedEvent', async () => {
    const table = TableMother.available()
    repository.search.mockResolvedValue(table)

    await useCase.run(table.id.value, TableStatus.INACTIVE)

    const events = eventBus.publish.mock.calls[0][0]
    expect(events[0]).toBeInstanceOf(TableStatusChangedEvent)
  })

  it('should throw TableOccupied when setting INACTIVE on an OCCUPIED table', async () => {
    const table = TableMother.occupied()
    repository.search.mockResolvedValue(table)

    await expect(useCase.run(table.id.value, TableStatus.INACTIVE)).rejects.toThrow(TableOccupied)
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('should throw TableNotExist when table does not exist', async () => {
    repository.search.mockResolvedValue(null)

    const { TableNotExist } = await import(
      '@contexts/restaurant/table/domain/exceptions/table-not-exist.exception'
    )
    await expect(useCase.run(UuidMother.random(), TableStatus.RESERVED)).rejects.toThrow(
      TableNotExist
    )
  })
})

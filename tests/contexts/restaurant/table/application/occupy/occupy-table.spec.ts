import { OccupyTable } from '@contexts/restaurant/table/application/occupy/occupy-table'
import { FindTable } from '@contexts/restaurant/table/application/find/find-table'
import { TableRepository } from '@contexts/restaurant/table/domain/repositories/table.repository'
import { EventBus } from '@shared/domain/events'
import { TableStatus } from '@contexts/restaurant/table/domain/table-status'
import { TableOccupied } from '@contexts/restaurant/table/domain/exceptions/table-occupied.exception'
import { TableMother } from '../../__mothers__/table.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('OccupyTable', () => {
  let useCase: OccupyTable
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
    useCase = new OccupyTable(repository, eventBus, findTable)
  })

  it('should occupy an available table with the given order', async () => {
    const table = TableMother.available()
    repository.search.mockResolvedValue(table)
    const orderId = UuidMother.random()

    await useCase.run(table.id.value, orderId)

    expect(repository.save).toHaveBeenCalledTimes(1)
    expect(table.getStatus()).toBe(TableStatus.OCCUPIED)
  })

  it('should throw TableOccupied when the table is already occupied by another order', async () => {
    const table = TableMother.occupied()
    repository.search.mockResolvedValue(table)

    await expect(useCase.run(table.id.value, UuidMother.random())).rejects.toThrow(TableOccupied)
    expect(repository.save).not.toHaveBeenCalled()
  })
})

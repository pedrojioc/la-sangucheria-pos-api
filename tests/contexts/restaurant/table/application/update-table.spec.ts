import { UpdateTable } from '@contexts/restaurant/table/application/update/update-table'
import { FindTable } from '@contexts/restaurant/table/application/find/find-table'
import { TableRepository } from '@contexts/restaurant/table/domain/repositories/table.repository'
import { EventBus } from '@shared/domain/events'
import { TableNumberAlreadyExists } from '@contexts/restaurant/table/domain/exceptions/table-number-already-exists.exception'
import { TableNotExist } from '@contexts/restaurant/table/domain/exceptions/table-not-exist.exception'
import { TableShape } from '@contexts/restaurant/table/domain/table-shape'
import { TableMother } from '../__mothers__/table.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('UpdateTable', () => {
  let useCase: UpdateTable
  let repository: jest.Mocked<TableRepository>
  let eventBus: jest.Mocked<EventBus>
  let findTable: FindTable

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchByNumber: jest.fn().mockResolvedValue(null),
      searchAll: jest.fn()
    } as jest.Mocked<TableRepository>

    eventBus = { publish: jest.fn() } as any
    findTable = new FindTable(repository)
    useCase = new UpdateTable(repository, eventBus, findTable)
  })

  it('should update a table when number is unchanged', async () => {
    const table = TableMother.mesa1()
    repository.search.mockResolvedValue(table)

    await useCase.run(table.id.value, '1', 6, TableShape.SQUARE)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0]
    expect(saved.toPrimitives().capacity).toBe(6)
  })

  it('should update a table when new number is available', async () => {
    const table = TableMother.mesa1()
    repository.search.mockResolvedValue(table)
    repository.searchByNumber.mockResolvedValue(null)

    await useCase.run(table.id.value, '10', 4, TableShape.SQUARE)

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0]
    expect(saved.toPrimitives().number).toBe('10')
  })

  it('should throw TableNumberAlreadyExists when new number is taken by another table', async () => {
    const table = TableMother.mesa1()
    const other = TableMother.withNumber('2')
    repository.search.mockResolvedValue(table)
    repository.searchByNumber.mockResolvedValue(other)

    await expect(useCase.run(table.id.value, '2', 4, TableShape.SQUARE)).rejects.toThrow(
      TableNumberAlreadyExists
    )
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('should throw TableNotExist when table does not exist', async () => {
    repository.search.mockResolvedValue(null)

    await expect(useCase.run(UuidMother.random(), '1', 4, TableShape.SQUARE)).rejects.toThrow(
      TableNotExist
    )
  })
})

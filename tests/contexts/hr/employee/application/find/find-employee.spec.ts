import { FindEmployee } from '@contexts/hr/employee/application/find/find-employee'
import { EmployeeQueryService } from '@contexts/hr/employee/application/services/employee-query.service'
import { EmployeeResponse } from '@contexts/hr/employee/application/dto/employee.response'
import { EmployeeNotExist } from '@contexts/hr/employee/domain/exceptions/employee-not-exist.exception'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'

describe('FindEmployee', () => {
  const buildQueryService = (): jest.Mocked<EmployeeQueryService> => ({
    search: jest.fn()
  })

  it('returns the joined EmployeeResponse when the employee exists', async () => {
    const queryService = buildQueryService()
    const employeeResponse = new EmployeeResponse(
      'employee-1',
      'Jane',
      'Doe',
      { id: 'position-1', name: 'Cook', description: null },
      null,
      null,
      null,
      null,
      'active',
      null,
      null,
      null
    )
    queryService.search.mockResolvedValue(PaginatedResult.create([employeeResponse], 1, 1, 1))

    const findEmployee = new FindEmployee(queryService)
    const result = await findEmployee.run('employee-1')

    expect(result).toBe(employeeResponse)
    expect(queryService.search).toHaveBeenCalledTimes(1)
  })

  it('throws EmployeeNotExist exactly once when the employee does not exist', async () => {
    const queryService = buildQueryService()
    queryService.search.mockResolvedValue(PaginatedResult.empty())

    const findEmployee = new FindEmployee(queryService)

    await expect(findEmployee.run('missing-id')).rejects.toThrow(EmployeeNotExist)
    expect(queryService.search).toHaveBeenCalledTimes(1)
  })
})

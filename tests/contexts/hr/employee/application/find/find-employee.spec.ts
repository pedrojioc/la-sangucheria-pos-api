import { FindEmployee } from '@contexts/hr/employee/application/find/find-employee'
import { EmployeeQueryService } from '@contexts/hr/employee/application/services/employee-query.service'
import { EmployeeResponse } from '@contexts/hr/employee/application/dto/employee.response'
import { EmployeeNotExist } from '@contexts/hr/employee/domain/exceptions/employee-not-exist.exception'

describe('FindEmployee', () => {
  const buildQueryService = (): jest.Mocked<EmployeeQueryService> => ({
    search: jest.fn(),
    findById: jest.fn()
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
    queryService.findById.mockResolvedValue(employeeResponse)

    const findEmployee = new FindEmployee(queryService)
    const result = await findEmployee.run('employee-1')

    expect(result).toBe(employeeResponse)
    expect(queryService.findById).toHaveBeenCalledWith('employee-1')
  })

  it('throws EmployeeNotExist exactly once when the employee does not exist', async () => {
    const queryService = buildQueryService()
    queryService.findById.mockResolvedValue(null)

    const findEmployee = new FindEmployee(queryService)

    await expect(findEmployee.run('missing-id')).rejects.toThrow(EmployeeNotExist)
    expect(queryService.findById).toHaveBeenCalledTimes(1)
  })
})

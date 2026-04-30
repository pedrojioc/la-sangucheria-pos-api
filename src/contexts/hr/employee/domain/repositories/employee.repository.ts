import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { Employee } from '../employee'
import { EmployeeId } from '../employee-id'

export abstract class EmployeeRepository {
  abstract save(employee: Employee): Promise<void>
  abstract search(id: EmployeeId): Promise<Employee | null>
  abstract delete(id: EmployeeId): Promise<void>
  abstract matching(criteria: Criteria): Promise<PaginatedResult<Employee>>
}

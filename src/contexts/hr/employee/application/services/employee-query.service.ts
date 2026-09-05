import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { EmployeeResponse } from '../dto/employee.response'

export abstract class EmployeeQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<EmployeeResponse>>
  abstract findById(id: string): Promise<EmployeeResponse | null>
}

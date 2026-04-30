import { PaginationMeta } from '@/shared/domain/criteria/paginated-result'
import { EmployeeResponse } from './employee.response'

export class PaginatedEmployeeListResponse {
  constructor(
    public readonly data: EmployeeResponse[],
    public readonly meta: PaginationMeta
  ) {}
}

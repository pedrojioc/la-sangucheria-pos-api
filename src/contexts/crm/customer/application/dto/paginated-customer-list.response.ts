import { CustomerResponse } from './customer.response'

export class PaginatedCustomerListResponse {
  constructor(
    public readonly items: CustomerResponse[],
    public readonly total: number,
    public readonly page: number,
    public readonly pageSize: number
  ) {}
}

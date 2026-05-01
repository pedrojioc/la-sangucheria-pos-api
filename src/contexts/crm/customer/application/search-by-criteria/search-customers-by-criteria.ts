import { CustomerRepository } from '../../domain/repositories/customer.repository'
import { CustomerResponse } from '../dto/customer.response'
import { PaginatedCustomerListResponse } from '../dto/paginated-customer-list.response'
import { Criteria } from '@/shared/domain/criteria/criteria'

export class SearchCustomersByCriteria {
  constructor(private readonly repository: CustomerRepository) {}

  async run(criteria: Criteria): Promise<PaginatedCustomerListResponse> {
    const result = await this.repository.matching(criteria)

    const items = result.data.map(c => {
      const p = c.toPrimitives()
      return new CustomerResponse(p.id, p.name, p.phone, p.email, p.documentType, p.documentNumber, p.taxRegime, p.defaultAddressId, p.notes, p.status)
    })

    return new PaginatedCustomerListResponse(items, result.meta.total, result.meta.page, result.meta.pageSize)
  }
}

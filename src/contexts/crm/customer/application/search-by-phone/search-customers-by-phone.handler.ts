import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SearchCustomersByPhoneQuery } from './search-customers-by-phone.query'
import { SearchCustomersByPhone } from './search-customers-by-phone'
import { CustomerResponse } from '../dto/customer.response'

@QueryHandler(SearchCustomersByPhoneQuery)
export class SearchCustomersByPhoneHandler implements IQueryHandler<SearchCustomersByPhoneQuery> {
  constructor(private readonly searchCustomersByPhone: SearchCustomersByPhone) {}

  async execute(query: SearchCustomersByPhoneQuery): Promise<CustomerResponse[]> {
    return this.searchCustomersByPhone.run(query.phone)
  }
}

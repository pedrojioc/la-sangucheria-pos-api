import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindCustomerQuery } from './find-customer.query'
import { FindCustomer } from './find-customer'
import { CustomerResponse } from '../dto/customer.response'

@QueryHandler(FindCustomerQuery)
export class FindCustomerHandler implements IQueryHandler<FindCustomerQuery> {
  constructor(private readonly findCustomer: FindCustomer) {}

  async execute(query: FindCustomerQuery): Promise<CustomerResponse> {
    return this.findCustomer.run(query.id)
  }
}

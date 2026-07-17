import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindAddressesByCustomerQuery } from './find-addresses-by-customer.query'
import { FindAddressesByCustomer } from './find-addresses-by-customer'
import { AddressResponse } from '../dto/address.response'

@QueryHandler(FindAddressesByCustomerQuery)
export class FindAddressesByCustomerHandler implements IQueryHandler<FindAddressesByCustomerQuery> {
  constructor(private readonly findAddressesByCustomer: FindAddressesByCustomer) {}

  execute(query: FindAddressesByCustomerQuery): Promise<AddressResponse[]> {
    return this.findAddressesByCustomer.run(query.customerId)
  }
}

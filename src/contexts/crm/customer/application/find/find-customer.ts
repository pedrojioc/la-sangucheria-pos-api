import { CustomerRepository } from '../../domain/repositories/customer.repository'
import { CustomerNotExist } from '../../domain/exceptions/customer-not-exist.exception'
import { CustomerId } from '../../domain/customer-id'
import { CustomerResponse } from '../dto/customer.response'

export class FindCustomer {
  constructor(private readonly repository: CustomerRepository) {}

  async run(id: string): Promise<CustomerResponse> {
    const customer = await this.repository.search(new CustomerId(id))
    if (!customer) throw new CustomerNotExist(id)

    const p = customer.toPrimitives()
    return new CustomerResponse(
      p.id,
      p.name,
      p.phone,
      p.email,
      p.documentType,
      p.documentNumber,
      p.taxRegime,
      p.defaultAddressId,
      p.notes,
      p.status
    )
  }
}

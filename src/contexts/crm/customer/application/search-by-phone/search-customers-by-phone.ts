import { CustomerRepository } from '../../domain/repositories/customer.repository'
import { CustomerResponse } from '../dto/customer.response'

export class SearchCustomersByPhone {
  constructor(private readonly repository: CustomerRepository) {}

  async run(phone: string): Promise<CustomerResponse[]> {
    const customers = await this.repository.searchByPhone(phone)
    return customers.map(c => {
      const p = c.toPrimitives()
      return new CustomerResponse(p.id, p.name, p.phone, p.email, p.documentType, p.documentNumber, p.taxRegime, p.defaultAddressId, p.notes, p.status)
    })
  }
}

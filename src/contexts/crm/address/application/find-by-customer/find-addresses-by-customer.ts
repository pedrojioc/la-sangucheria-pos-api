import { AddressRepository } from '../../domain/repositories/address.repository'
import { AddressResponse } from '../dto/address.response'

export class FindAddressesByCustomer {
  constructor(private readonly repository: AddressRepository) {}

  async run(customerId: string): Promise<AddressResponse[]> {
    const addresses = await this.repository.findByCustomer(customerId)
    return addresses.map((address) => {
      const p = address.toPrimitives()
      return new AddressResponse(p.id, p.customerId, p.label, p.street, p.neighborhood, p.city, p.reference, p.coordinates)
    })
  }
}

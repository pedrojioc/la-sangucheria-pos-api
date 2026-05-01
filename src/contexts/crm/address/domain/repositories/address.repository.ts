import { Address } from '../address'
import { AddressId } from '../address-id'

export abstract class AddressRepository {
  abstract save(address: Address): Promise<void>
  abstract search(id: AddressId): Promise<Address | null>
  abstract findByCustomer(customerId: string): Promise<Address[]>
  abstract countByCustomer(customerId: string): Promise<number>
  abstract delete(id: AddressId): Promise<void>
}

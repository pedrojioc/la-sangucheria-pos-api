import { AddressRepository } from '../../domain/repositories/address.repository'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { AddressNotExist } from '../../domain/exceptions/address-not-exist.exception'
import { CustomerNotExist } from '@/contexts/crm/customer/domain/exceptions/customer-not-exist.exception'
import { AddressId } from '../../domain/address-id'
import { CustomerId } from '@/contexts/crm/customer/domain/customer-id'
import { EventBus } from '@/shared/domain/events'

export class SetDefaultAddress {
  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(addressId: string, customerId: string): Promise<void> {
    const address = await this.addressRepository.search(new AddressId(addressId))
    if (!address) throw new AddressNotExist(addressId)

    const customer = await this.customerRepository.search(new CustomerId(customerId))
    if (!customer) throw new CustomerNotExist(customerId)

    customer.setDefaultAddress(addressId)
    await this.customerRepository.save(customer)
    await this.eventBus.publish(customer.pullDomainEvents())
  }
}

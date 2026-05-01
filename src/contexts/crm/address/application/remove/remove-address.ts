import { AddressRepository } from '../../domain/repositories/address.repository'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { AddressNotExist } from '../../domain/exceptions/address-not-exist.exception'
import { CannotRemoveDefaultAddress } from '../../domain/exceptions/cannot-remove-default-address.exception'
import { CustomerNotExist } from '@/contexts/crm/customer/domain/exceptions/customer-not-exist.exception'
import { AddressId } from '../../domain/address-id'
import { CustomerId } from '@/contexts/crm/customer/domain/customer-id'
import { AddressRemovedEvent } from '../../domain/events/address-removed.event'
import { EventBus } from '@/shared/domain/events'

export class RemoveAddress {
  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string, customerId: string): Promise<void> {
    const address = await this.addressRepository.search(new AddressId(id))
    if (!address) throw new AddressNotExist(id)

    const customer = await this.customerRepository.search(new CustomerId(customerId))
    if (!customer) throw new CustomerNotExist(customerId)

    const isDefault = customer.toPrimitives().defaultAddressId === id
    const count = await this.addressRepository.countByCustomer(customerId)

    if (isDefault && count > 1) throw new CannotRemoveDefaultAddress(id)

    await this.addressRepository.delete(new AddressId(id))

    if (isDefault && count === 1) {
      customer.setDefaultAddress(null)
      await this.customerRepository.save(customer)
    }

    await this.eventBus.publish([new AddressRemovedEvent({ addressId: id, customerId })])
  }
}

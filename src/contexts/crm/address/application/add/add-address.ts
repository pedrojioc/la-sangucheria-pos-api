import { Address } from '../../domain/address'
import { AddressRepository } from '../../domain/repositories/address.repository'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { CustomerNotExist } from '@/contexts/crm/customer/domain/exceptions/customer-not-exist.exception'
import { CustomerId } from '@/contexts/crm/customer/domain/customer-id'
import { GeoPointPrimitives } from '../../domain/address-geo-point'
import { EventBus } from '@/shared/domain/events'

export class AddAddress {
  constructor(
    private readonly addressRepository: AddressRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    customerId: string,
    label: string,
    street: string,
    neighborhood: string | null,
    city: string,
    reference: string | null,
    coordinates: GeoPointPrimitives | null
  ): Promise<void> {
    const customer = await this.customerRepository.search(new CustomerId(customerId))
    if (!customer) throw new CustomerNotExist(customerId)

    const isFirst = (await this.addressRepository.countByCustomer(customerId)) === 0

    const address = Address.create(id, customerId, label, street, neighborhood, city, reference, coordinates)
    await this.addressRepository.save(address)

    if (isFirst) {
      customer.setDefaultAddress(id)
      await this.customerRepository.save(customer)
    }

    await this.eventBus.publish(address.pullDomainEvents())
  }
}

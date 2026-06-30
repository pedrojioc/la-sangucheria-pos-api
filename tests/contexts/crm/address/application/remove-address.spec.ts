import { RemoveAddress } from '@/contexts/crm/address/application/remove/remove-address'
import { AddressRepository } from '@/contexts/crm/address/domain/repositories/address.repository'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { AddressNotExist } from '@/contexts/crm/address/domain/exceptions/address-not-exist.exception'
import { CannotRemoveDefaultAddress } from '@/contexts/crm/address/domain/exceptions/cannot-remove-default-address.exception'
import { EventBus } from '@/shared/domain/events'
import { CustomerMother } from '../../customer/__mothers__/customer.mother'
import { AddressMother } from '../__mothers__/address.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('RemoveAddress', () => {
  let useCase: RemoveAddress
  let addressRepository: jest.Mocked<AddressRepository>
  let customerRepository: jest.Mocked<CustomerRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    addressRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findByCustomer: jest.fn(),
      countByCustomer: jest.fn(),
      delete: jest.fn()
    } as any

    customerRepository = {
      save: jest.fn(),
      search: jest.fn(),
      searchByPhone: jest.fn(),
      existsByPhone: jest.fn(),
      existsByDocument: jest.fn(),
      matching: jest.fn()
    } as any

    eventBus = { publish: jest.fn() } as any
    useCase = new RemoveAddress(addressRepository, customerRepository, eventBus)
  })

  it('should remove a non-default address successfully', async () => {
    const customerId = UuidMother.random()
    const defaultAddressId = UuidMother.random()
    const address = AddressMother.create({ id: UuidMother.random(), customerId })
    const customer = CustomerMother.withDefaultAddress(defaultAddressId)

    addressRepository.search.mockResolvedValue(address)
    customerRepository.search.mockResolvedValue(customer)
    addressRepository.countByCustomer.mockResolvedValue(2)

    await useCase.run(address.id.value, customerId)

    expect(addressRepository.delete).toHaveBeenCalledTimes(1)
    expect(customerRepository.save).not.toHaveBeenCalled()
  })

  it('should throw CannotRemoveDefaultAddress when removing default with other addresses', async () => {
    const customerId = UuidMother.random()
    const addressId = UuidMother.random()
    const address = AddressMother.create({ id: addressId, customerId })
    const customer = CustomerMother.withDefaultAddress(addressId)

    addressRepository.search.mockResolvedValue(address)
    customerRepository.search.mockResolvedValue(customer)
    addressRepository.countByCustomer.mockResolvedValue(2)

    await expect(useCase.run(addressId, customerId)).rejects.toThrow(CannotRemoveDefaultAddress)

    expect(addressRepository.delete).not.toHaveBeenCalled()
  })

  it('should remove the only address and clear defaultAddressId on customer', async () => {
    const customerId = UuidMother.random()
    const addressId = UuidMother.random()
    const address = AddressMother.create({ id: addressId, customerId })
    const customer = CustomerMother.withDefaultAddress(addressId)

    addressRepository.search.mockResolvedValue(address)
    customerRepository.search.mockResolvedValue(customer)
    addressRepository.countByCustomer.mockResolvedValue(1)

    await useCase.run(addressId, customerId)

    expect(addressRepository.delete).toHaveBeenCalledTimes(1)
    expect(customerRepository.save).toHaveBeenCalledTimes(1)
    const savedCustomer = customerRepository.save.mock.calls[0][0]
    expect(savedCustomer.toPrimitives().defaultAddressId).toBeNull()
  })

  it('should throw AddressNotExist when address not found', async () => {
    addressRepository.search.mockResolvedValue(null)

    await expect(useCase.run(UuidMother.random(), UuidMother.random())).rejects.toThrow(
      AddressNotExist
    )
  })

  it('should publish AddressRemovedEvent', async () => {
    const customerId = UuidMother.random()
    const address = AddressMother.forCustomer(customerId)
    const customer = CustomerMother.withDefaultAddress(UuidMother.random())

    addressRepository.search.mockResolvedValue(address)
    customerRepository.search.mockResolvedValue(customer)
    addressRepository.countByCustomer.mockResolvedValue(2)

    await useCase.run(address.id.value, customerId)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events[0].eventName).toBe('address.removed')
  })
})

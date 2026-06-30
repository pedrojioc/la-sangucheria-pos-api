import { SetDefaultAddress } from '@/contexts/crm/address/application/set-default/set-default-address'
import { AddressRepository } from '@/contexts/crm/address/domain/repositories/address.repository'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { AddressNotExist } from '@/contexts/crm/address/domain/exceptions/address-not-exist.exception'
import { CustomerNotExist } from '@/contexts/crm/customer/domain/exceptions/customer-not-exist.exception'
import { EventBus } from '@/shared/domain/events'
import { CustomerMother } from '../../customer/__mothers__/customer.mother'
import { AddressMother } from '../__mothers__/address.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('SetDefaultAddress', () => {
  let useCase: SetDefaultAddress
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
    useCase = new SetDefaultAddress(addressRepository, customerRepository, eventBus)
  })

  it('should update defaultAddressId on customer', async () => {
    const oldDefault = UuidMother.random()
    const newDefault = UuidMother.random()
    const address = AddressMother.create({ id: newDefault })
    const customer = CustomerMother.withDefaultAddress(oldDefault)

    addressRepository.search.mockResolvedValue(address)
    customerRepository.search.mockResolvedValue(customer)

    await useCase.run(newDefault, customer.id.value)

    expect(customerRepository.save).toHaveBeenCalledTimes(1)
    const saved = customerRepository.save.mock.calls[0][0]
    expect(saved.toPrimitives().defaultAddressId).toBe(newDefault)
  })

  it('should throw AddressNotExist when address not found', async () => {
    addressRepository.search.mockResolvedValue(null)

    await expect(useCase.run(UuidMother.random(), UuidMother.random())).rejects.toThrow(
      AddressNotExist
    )

    expect(customerRepository.save).not.toHaveBeenCalled()
  })

  it('should throw CustomerNotExist when customer not found', async () => {
    addressRepository.search.mockResolvedValue(AddressMother.random())
    customerRepository.search.mockResolvedValue(null)

    await expect(useCase.run(UuidMother.random(), UuidMother.random())).rejects.toThrow(
      CustomerNotExist
    )

    expect(customerRepository.save).not.toHaveBeenCalled()
  })
})

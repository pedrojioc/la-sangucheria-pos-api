import { AddAddress } from '@/contexts/crm/address/application/add/add-address'
import { AddressRepository } from '@/contexts/crm/address/domain/repositories/address.repository'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { CustomerNotExist } from '@/contexts/crm/customer/domain/exceptions/customer-not-exist.exception'
import { EventBus } from '@/shared/domain/events'
import { CustomerMother } from '../../customer/__mothers__/customer.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { Address } from '@/contexts/crm/address/domain/address'

describe('AddAddress', () => {
  let useCase: AddAddress
  let addressRepository: jest.Mocked<AddressRepository>
  let customerRepository: jest.Mocked<CustomerRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    addressRepository = {
      save: jest.fn(),
      search: jest.fn(),
      findByCustomer: jest.fn(),
      countByCustomer: jest.fn().mockResolvedValue(0),
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
    useCase = new AddAddress(addressRepository, customerRepository, eventBus)
  })

  it('should save the address', async () => {
    const customer = CustomerMother.random()
    customerRepository.search.mockResolvedValue(customer)

    const addressId = UuidMother.random()
    await useCase.run(
      addressId,
      customer.id.value,
      'Casa',
      'Calle 10 #5-20',
      null,
      'Bogotá',
      null,
      null
    )

    expect(addressRepository.save).toHaveBeenCalledTimes(1)
    const saved = addressRepository.save.mock.calls[0][0] as Address
    expect(saved.toPrimitives().id).toBe(addressId)
    expect(saved.toPrimitives().label).toBe('Casa')
  })

  it('should set first address as default on customer', async () => {
    const customer = CustomerMother.random()
    customerRepository.search.mockResolvedValue(customer)
    addressRepository.countByCustomer.mockResolvedValue(0)

    const addressId = UuidMother.random()
    await useCase.run(addressId, customer.id.value, 'Casa', 'Calle 10', null, 'Bogotá', null, null)

    expect(customerRepository.save).toHaveBeenCalledTimes(1)
    const savedCustomer = customerRepository.save.mock.calls[0][0]
    expect(savedCustomer.toPrimitives().defaultAddressId).toBe(addressId)
  })

  it('should NOT change default when customer already has addresses', async () => {
    const customer = CustomerMother.withDefaultAddress(UuidMother.random())
    customerRepository.search.mockResolvedValue(customer)
    addressRepository.countByCustomer.mockResolvedValue(1)

    await useCase.run(
      UuidMother.random(),
      customer.id.value,
      'Oficina',
      'Cra 7',
      null,
      'Bogotá',
      null,
      null
    )

    expect(customerRepository.save).not.toHaveBeenCalled()
  })

  it('should throw CustomerNotExist when customer not found', async () => {
    customerRepository.search.mockResolvedValue(null)

    await expect(
      useCase.run(
        UuidMother.random(),
        UuidMother.random(),
        'Casa',
        'Calle',
        null,
        'Ciudad',
        null,
        null
      )
    ).rejects.toThrow(CustomerNotExist)

    expect(addressRepository.save).not.toHaveBeenCalled()
  })

  it('should publish AddressAddedEvent', async () => {
    const customer = CustomerMother.random()
    customerRepository.search.mockResolvedValue(customer)

    await useCase.run(
      UuidMother.random(),
      customer.id.value,
      'Casa',
      'Calle',
      null,
      'Ciudad',
      null,
      null
    )

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events[0].eventName).toBe('address.added')
  })
})

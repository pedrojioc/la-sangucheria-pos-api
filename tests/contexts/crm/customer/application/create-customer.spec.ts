import { CreateCustomer } from '@/contexts/crm/customer/application/create/create-customer'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { CustomerPhoneAlreadyExists } from '@/contexts/crm/customer/domain/exceptions/customer-phone-already-exists.exception'
import { CustomerDocumentAlreadyExists } from '@/contexts/crm/customer/domain/exceptions/customer-document-already-exists.exception'
import { EventBus } from '@/shared/domain/events'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { Customer } from '@/contexts/crm/customer/domain/customer'
import { CustomerCreatedEvent } from '@/contexts/crm/customer/domain/events/customer-created.event'

describe('CreateCustomer', () => {
  let useCase: CreateCustomer
  let repository: jest.Mocked<CustomerRepository>
  let eventBus: jest.Mocked<EventBus>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchByPhone: jest.fn(),
      existsByPhone: jest.fn().mockResolvedValue(false),
      existsByDocument: jest.fn().mockResolvedValue(false),
      matching: jest.fn()
    } as any

    eventBus = { publish: jest.fn() } as any
    useCase = new CreateCustomer(repository, eventBus)
  })

  it('should create a customer with full data', async () => {
    const id = UuidMother.random()

    await useCase.run(id, 'Pedro Jiménez', '+573001234567', 'pedro@mail.com', 'CC', '123456789', 'SIMPLIFIED', 'VIP')

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0] as Customer
    const p = saved.toPrimitives()
    expect(p.id).toBe(id)
    expect(p.name).toBe('Pedro Jiménez')
    expect(p.status).toBe('active')
    expect(p.email).toBe('pedro@mail.com')
    expect(p.notes).toBe('VIP')
  })

  it('should create a customer with minimum required data', async () => {
    const id = UuidMother.random()

    await useCase.run(id, 'Ana López', '+573009999999', null, 'NIT', '900123456', 'COMMON', null)

    const saved = repository.save.mock.calls[0][0] as Customer
    const p = saved.toPrimitives()
    expect(p.email).toBeNull()
    expect(p.notes).toBeNull()
    expect(p.status).toBe('active')
    expect(p.defaultAddressId).toBeNull()
  })

  it('should publish CustomerCreatedEvent', async () => {
    await useCase.run(UuidMother.random(), 'Test', '+57300', null, 'CC', '111', 'SIMPLIFIED', null)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const events = eventBus.publish.mock.calls[0][0]
    expect(events).toHaveLength(1)
    expect(events[0]).toBeInstanceOf(CustomerCreatedEvent)
    expect(events[0].eventName).toBe('customer.created')
  })

  it('should throw CustomerPhoneAlreadyExists when phone is taken', async () => {
    repository.existsByPhone.mockResolvedValue(true)

    await expect(
      useCase.run(UuidMother.random(), 'Test', '+573001234567', null, 'CC', '999', 'SIMPLIFIED', null)
    ).rejects.toThrow(CustomerPhoneAlreadyExists)

    expect(repository.save).not.toHaveBeenCalled()
    expect(eventBus.publish).not.toHaveBeenCalled()
  })

  it('should throw CustomerDocumentAlreadyExists when document is taken', async () => {
    repository.existsByDocument.mockResolvedValue(true)

    await expect(
      useCase.run(UuidMother.random(), 'Test', '+57300unique', null, 'CC', '123456789', 'SIMPLIFIED', null)
    ).rejects.toThrow(CustomerDocumentAlreadyExists)

    expect(repository.save).not.toHaveBeenCalled()
  })

  it('should check phone uniqueness before document uniqueness', async () => {
    repository.existsByPhone.mockResolvedValue(true)

    await expect(
      useCase.run(UuidMother.random(), 'Test', '+57300', null, 'CC', '111', 'SIMPLIFIED', null)
    ).rejects.toThrow(CustomerPhoneAlreadyExists)

    expect(repository.existsByDocument).not.toHaveBeenCalled()
  })
})

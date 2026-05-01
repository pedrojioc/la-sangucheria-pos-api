import { UpdateCustomer } from '@/contexts/crm/customer/application/update/update-customer'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { CustomerNotExist } from '@/contexts/crm/customer/domain/exceptions/customer-not-exist.exception'
import { CustomerPhoneAlreadyExists } from '@/contexts/crm/customer/domain/exceptions/customer-phone-already-exists.exception'
import { EventBus } from '@/shared/domain/events'
import { CustomerMother } from '../__mothers__/customer.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { CustomerUpdatedEvent } from '@/contexts/crm/customer/domain/events/customer-updated.event'

describe('UpdateCustomer', () => {
  let useCase: UpdateCustomer
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
    useCase = new UpdateCustomer(repository, eventBus)
  })

  it('should update allowed fields', async () => {
    const customer = CustomerMother.create({ phone: '+573001111111' })
    repository.search.mockResolvedValue(customer)

    await useCase.run(customer.id.value, 'Nuevo Nombre', '+573001111111', 'nuevo@mail.com', 'COMMON', 'nota')

    expect(repository.save).toHaveBeenCalledTimes(1)
    const saved = repository.save.mock.calls[0][0]
    const p = saved.toPrimitives()
    expect(p.name).toBe('Nuevo Nombre')
    expect(p.email).toBe('nuevo@mail.com')
    expect(p.taxRegime).toBe('COMMON')
    expect(p.notes).toBe('nota')
  })

  it('should not change documentType or documentNumber', async () => {
    const customer = CustomerMother.withDocument('CC', '123456789')
    repository.search.mockResolvedValue(customer)

    await useCase.run(customer.id.value, 'Test', customer.toPrimitives().phone, null, 'SIMPLIFIED', null)

    const saved = repository.save.mock.calls[0][0]
    const p = saved.toPrimitives()
    expect(p.documentType).toBe('CC')
    expect(p.documentNumber).toBe('123456789')
  })

  it('should publish CustomerUpdatedEvent', async () => {
    const customer = CustomerMother.random()
    repository.search.mockResolvedValue(customer)

    await useCase.run(customer.id.value, 'Test', customer.toPrimitives().phone, null, 'SIMPLIFIED', null)

    const events = eventBus.publish.mock.calls[0][0]
    expect(events[0]).toBeInstanceOf(CustomerUpdatedEvent)
  })

  it('should throw CustomerNotExist when customer not found', async () => {
    repository.search.mockResolvedValue(null)

    await expect(
      useCase.run(UuidMother.random(), 'Test', '+57300', null, 'SIMPLIFIED', null)
    ).rejects.toThrow(CustomerNotExist)

    expect(repository.save).not.toHaveBeenCalled()
  })

  it('should throw CustomerPhoneAlreadyExists when new phone is taken by another customer', async () => {
    const customer = CustomerMother.withPhone('+573001111111')
    repository.search.mockResolvedValue(customer)
    repository.existsByPhone.mockResolvedValue(true)

    await expect(
      useCase.run(customer.id.value, 'Test', '+573002222222', null, 'SIMPLIFIED', null)
    ).rejects.toThrow(CustomerPhoneAlreadyExists)
  })

  it('should allow updating with the same phone (no conflict)', async () => {
    const customer = CustomerMother.withPhone('+573001111111')
    repository.search.mockResolvedValue(customer)
    repository.existsByPhone.mockResolvedValue(false)

    await expect(
      useCase.run(customer.id.value, 'Test', '+573001111111', null, 'SIMPLIFIED', null)
    ).resolves.not.toThrow()
  })
})

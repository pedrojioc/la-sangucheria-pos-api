import { FindCustomer } from '@/contexts/crm/customer/application/find/find-customer'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { CustomerNotExist } from '@/contexts/crm/customer/domain/exceptions/customer-not-exist.exception'
import { CustomerResponse } from '@/contexts/crm/customer/application/dto/customer.response'
import { CustomerMother } from '../__mothers__/customer.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('FindCustomer', () => {
  let useCase: FindCustomer
  let repository: jest.Mocked<CustomerRepository>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchByPhone: jest.fn(),
      existsByPhone: jest.fn(),
      existsByDocument: jest.fn(),
      matching: jest.fn()
    } as any

    useCase = new FindCustomer(repository)
  })

  it('should return CustomerResponse when customer exists', async () => {
    const customer = CustomerMother.random()
    repository.search.mockResolvedValue(customer)

    const result = await useCase.run(customer.id.value)

    expect(result).toBeInstanceOf(CustomerResponse)
    expect(result.id).toBe(customer.id.value)
    expect(result.name).toBe(customer.toPrimitives().name)
    expect(result.status).toBe('active')
  })

  it('should throw CustomerNotExist when customer not found', async () => {
    repository.search.mockResolvedValue(null)

    await expect(useCase.run(UuidMother.random())).rejects.toThrow(CustomerNotExist)
  })

  it('should include all primitive fields in response', async () => {
    const customer = CustomerMother.create({
      documentType: 'NIT',
      documentNumber: '900123456',
      taxRegime: 'COMMON',
      email: 'test@mail.com',
      notes: 'nota'
    })
    repository.search.mockResolvedValue(customer)

    const result = await useCase.run(customer.id.value)

    expect(result.documentType).toBe('NIT')
    expect(result.documentNumber).toBe('900123456')
    expect(result.taxRegime).toBe('COMMON')
    expect(result.email).toBe('test@mail.com')
    expect(result.notes).toBe('nota')
  })
})

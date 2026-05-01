import { SearchCustomersByPhone } from '@/contexts/crm/customer/application/search-by-phone/search-customers-by-phone'
import { CustomerRepository } from '@/contexts/crm/customer/domain/repositories/customer.repository'
import { CustomerResponse } from '@/contexts/crm/customer/application/dto/customer.response'
import { CustomerMother } from '../__mothers__/customer.mother'

describe('SearchCustomersByPhone', () => {
  let useCase: SearchCustomersByPhone
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

    useCase = new SearchCustomersByPhone(repository)
  })

  it('should return matching active customers', async () => {
    const customers = [
      CustomerMother.withPhone('+573001234567'),
      CustomerMother.withPhone('+573001239999')
    ]
    repository.searchByPhone.mockResolvedValue(customers)

    const result = await useCase.run('+57300123')

    expect(result).toHaveLength(2)
    expect(result[0]).toBeInstanceOf(CustomerResponse)
    expect(repository.searchByPhone).toHaveBeenCalledWith('+57300123')
  })

  it('should return empty array when no match', async () => {
    repository.searchByPhone.mockResolvedValue([])

    const result = await useCase.run('+57999')

    expect(result).toHaveLength(0)
  })

  it('should return at most 5 results (enforced by repository)', async () => {
    const customers = Array.from({ length: 5 }, () => CustomerMother.random())
    repository.searchByPhone.mockResolvedValue(customers)

    const result = await useCase.run('+57')

    expect(result).toHaveLength(5)
  })

  it('should map each customer to CustomerResponse', async () => {
    const customer = CustomerMother.create({ documentType: 'NIT', taxRegime: 'COMMON' })
    repository.searchByPhone.mockResolvedValue([customer])

    const result = await useCase.run(customer.toPrimitives().phone)

    expect(result[0].documentType).toBe('NIT')
    expect(result[0].taxRegime).toBe('COMMON')
    expect(result[0].status).toBe('active')
  })
})

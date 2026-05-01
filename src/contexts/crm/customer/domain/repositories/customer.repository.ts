import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { Customer } from '../customer'
import { CustomerId } from '../customer-id'
import { DocumentTypeValue } from '../customer-document-type'

export abstract class CustomerRepository {
  abstract save(customer: Customer): Promise<void>
  abstract search(id: CustomerId): Promise<Customer | null>
  abstract searchByPhone(phone: string): Promise<Customer[]>
  abstract existsByPhone(phone: string): Promise<boolean>
  abstract existsByDocument(type: DocumentTypeValue, number: string): Promise<boolean>
  abstract matching(criteria: Criteria): Promise<PaginatedResult<Customer>>
}

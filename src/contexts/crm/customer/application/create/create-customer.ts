import { Customer } from '../../domain/customer'
import { CustomerRepository } from '../../domain/repositories/customer.repository'
import { CustomerPhoneAlreadyExists } from '../../domain/exceptions/customer-phone-already-exists.exception'
import { CustomerDocumentAlreadyExists } from '../../domain/exceptions/customer-document-already-exists.exception'
import { DocumentTypeValue } from '../../domain/customer-document-type'
import { TaxRegimeValue } from '../../domain/customer-tax-regime'
import { EventBus } from '@/shared/domain/events'

export class CreateCustomer {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    name: string,
    phone: string,
    email: string | null,
    documentType: DocumentTypeValue,
    documentNumber: string,
    taxRegime: TaxRegimeValue,
    notes: string | null
  ): Promise<void> {
    if (await this.repository.existsByPhone(phone)) {
      throw new CustomerPhoneAlreadyExists(phone)
    }

    if (await this.repository.existsByDocument(documentType, documentNumber)) {
      throw new CustomerDocumentAlreadyExists(documentType, documentNumber)
    }

    const customer = Customer.create(
      id,
      name,
      phone,
      email,
      documentType,
      documentNumber,
      taxRegime,
      notes
    )
    await this.repository.save(customer)
    await this.eventBus.publish(customer.pullDomainEvents())
  }
}

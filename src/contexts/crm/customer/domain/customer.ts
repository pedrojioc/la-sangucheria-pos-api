import { AggregateRoot } from '@shared/domain/aggregate-root'
import { CustomerId } from './customer-id'
import { CustomerName } from './customer-name'
import { CustomerPhone } from './customer-phone'
import { CustomerEmail } from './customer-email'
import { CustomerDocumentNumber } from './customer-document-number'
import { CustomerNotes } from './customer-notes'
import { DocumentTypeValue } from './customer-document-type'
import { TaxRegimeValue } from './customer-tax-regime'
import { CustomerStatusValue } from './customer-status'
import { CustomerCreatedEvent } from './events/customer-created.event'
import { CustomerUpdatedEvent } from './events/customer-updated.event'
import { CustomerDeactivatedEvent } from './events/customer-deactivated.event'

export interface CustomerPrimitives {
  id: string
  name: string
  phone: string
  email: string | null
  documentType: DocumentTypeValue
  documentNumber: string
  taxRegime: TaxRegimeValue
  defaultAddressId: string | null
  lifetimeValue: number
  notes: string | null
  status: CustomerStatusValue
}

export class Customer extends AggregateRoot {
  private constructor(
    public readonly id: CustomerId,
    private name: CustomerName,
    private phone: CustomerPhone,
    private email: CustomerEmail | null,
    private readonly documentType: DocumentTypeValue,
    private readonly documentNumber: CustomerDocumentNumber,
    private taxRegime: TaxRegimeValue,
    private defaultAddressId: string | null,
    private lifetimeValue: number,
    private notes: CustomerNotes | null,
    private status: CustomerStatusValue
  ) {
    super()
  }

  static create(
    id: string,
    name: string,
    phone: string,
    email: string | null,
    documentType: DocumentTypeValue,
    documentNumber: string,
    taxRegime: TaxRegimeValue,
    notes: string | null
  ): Customer {
    const customer = Customer.fromPrimitives({
      id,
      name,
      phone,
      email,
      documentType,
      documentNumber,
      taxRegime,
      defaultAddressId: null,
      lifetimeValue: 0,
      notes,
      status: 'active'
    })

    customer.record(
      new CustomerCreatedEvent({ customerId: id, name, phone, documentType, documentNumber })
    )

    return customer
  }

  static fromPrimitives(primitives: CustomerPrimitives): Customer {
    return new Customer(
      new CustomerId(primitives.id),
      new CustomerName(primitives.name),
      new CustomerPhone(primitives.phone),
      primitives.email !== null ? new CustomerEmail(primitives.email) : null,
      primitives.documentType,
      new CustomerDocumentNumber(primitives.documentNumber),
      primitives.taxRegime,
      primitives.defaultAddressId,
      primitives.lifetimeValue,
      primitives.notes !== null ? new CustomerNotes(primitives.notes) : null,
      primitives.status
    )
  }

  update(
    name: string,
    phone: string,
    email: string | null,
    taxRegime: TaxRegimeValue,
    notes: string | null
  ): void {
    this.name = new CustomerName(name)
    this.phone = new CustomerPhone(phone)
    this.email = email !== null ? new CustomerEmail(email) : null
    this.taxRegime = taxRegime
    this.notes = notes !== null ? new CustomerNotes(notes) : null
    this.record(new CustomerUpdatedEvent({ customerId: this.id.value }))
  }

  deactivate(): void {
    this.status = 'inactive'
    this.record(new CustomerDeactivatedEvent({ customerId: this.id.value }))
  }

  setDefaultAddress(addressId: string | null): void {
    this.defaultAddressId = addressId
  }

  isActive(): boolean {
    return this.status === 'active'
  }

  addToLifetimeValue(amount: number): void {
    this.lifetimeValue += amount
  }

  toPrimitives(): CustomerPrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      phone: this.phone.value,
      email: this.email?.value ?? null,
      documentType: this.documentType,
      documentNumber: this.documentNumber.value,
      taxRegime: this.taxRegime,
      defaultAddressId: this.defaultAddressId,
      lifetimeValue: this.lifetimeValue,
      notes: this.notes?.value ?? null,
      status: this.status
    }
  }
}

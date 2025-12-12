import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { SupplierId } from './supplier-id'
import { SupplierName } from './supplier-name'
import { SupplierContactName } from './supplier-contact-name'
import { SupplierEmail } from './supplier-email'
import { SupplierPhone } from './supplier-phone'
import { SupplierAddress } from './supplier-address'
import { SupplierTaxId } from './supplier-tax-id'
import { SupplierPaymentTerms } from './supplier-payment-terms'
import { SupplierNotes } from './supplier-notes'
import { SupplierIsActive } from './supplier-is-active'
import { SupplierWhatsappNumber } from './supplier-whatsapp-number'
import { SupplierRating } from './supplier-rating'
import { SupplierCreatedEvent } from './events/supplier-created.event'

export interface SupplierPrimitives {
  id: string
  name: string
  contactName: string | null
  email: string | null
  phone: string | null
  whatsappNumber: string | null
  address: string | null
  taxId: string | null
  paymentTerms: string | null
  notes: string | null
  rating: number | null
  isActive: boolean
}

export class Supplier extends AggregateRoot {
  private constructor(
    public readonly id: SupplierId,
    private name: SupplierName,
    private contactName: SupplierContactName | null,
    private email: SupplierEmail | null,
    private phone: SupplierPhone | null,
    private whatsappNumber: SupplierWhatsappNumber | null,
    private address: SupplierAddress | null,
    private taxId: SupplierTaxId | null,
    private paymentTerms: SupplierPaymentTerms | null,
    private notes: SupplierNotes | null,
    private rating: SupplierRating | null,
    private isActive: SupplierIsActive
  ) {
    super()
  }

  static create(
    id: string,
    name: string,
    contactName: string | null,
    email: string | null,
    phone: string | null,
    whatsappNumber: string | null,
    address: string | null,
    taxId: string | null,
    paymentTerms: string | null,
    notes: string | null,
    rating: number | null,
    isActive: boolean
  ): Supplier {
    const supplier = Supplier.fromPrimitives({
      id,
      name,
      contactName,
      email,
      phone,
      whatsappNumber,
      address,
      taxId,
      paymentTerms,
      notes,
      rating,
      isActive
    })

    supplier.record(
      new SupplierCreatedEvent({
        supplierId: id,
        name,
        email
      })
    )

    return supplier
  }

  static fromPrimitives(primitives: SupplierPrimitives): Supplier {
    return new Supplier(
      new SupplierId(primitives.id),
      new SupplierName(primitives.name),
      primitives.contactName !== null ? new SupplierContactName(primitives.contactName) : null,
      primitives.email !== null ? new SupplierEmail(primitives.email) : null,
      primitives.phone !== null ? new SupplierPhone(primitives.phone) : null,
      primitives.whatsappNumber !== null ? new SupplierWhatsappNumber(primitives.whatsappNumber) : null,
      primitives.address !== null ? new SupplierAddress(primitives.address) : null,
      primitives.taxId !== null ? new SupplierTaxId(primitives.taxId) : null,
      primitives.paymentTerms !== null ? new SupplierPaymentTerms(primitives.paymentTerms) : null,
      primitives.notes !== null ? new SupplierNotes(primitives.notes) : null,
      primitives.rating !== null ? new SupplierRating(primitives.rating) : null,
      new SupplierIsActive(primitives.isActive)
    )
  }

  update(
    name: string,
    contactName: string | null,
    email: string | null,
    phone: string | null,
    whatsappNumber: string | null,
    address: string | null,
    taxId: string | null,
    paymentTerms: string | null,
    notes: string | null,
    rating: number | null,
    isActive: boolean
  ): void {
    this.name = new SupplierName(name)
    this.contactName = contactName !== null ? new SupplierContactName(contactName) : null
    this.email = email !== null ? new SupplierEmail(email) : null
    this.phone = phone !== null ? new SupplierPhone(phone) : null
    this.whatsappNumber = whatsappNumber !== null ? new SupplierWhatsappNumber(whatsappNumber) : null
    this.address = address !== null ? new SupplierAddress(address) : null
    this.taxId = taxId !== null ? new SupplierTaxId(taxId) : null
    this.paymentTerms = paymentTerms !== null ? new SupplierPaymentTerms(paymentTerms) : null
    this.notes = notes !== null ? new SupplierNotes(notes) : null
    this.rating = rating !== null ? new SupplierRating(rating) : null
    this.isActive = new SupplierIsActive(isActive)
  }

  toPrimitives(): SupplierPrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      contactName: this.contactName?.value ?? null,
      email: this.email?.value ?? null,
      phone: this.phone?.value ?? null,
      whatsappNumber: this.whatsappNumber?.value ?? null,
      address: this.address?.value ?? null,
      taxId: this.taxId?.value ?? null,
      paymentTerms: this.paymentTerms?.value ?? null,
      notes: this.notes?.value ?? null,
      rating: this.rating?.value ?? null,
      isActive: this.isActive.value
    }
  }
}

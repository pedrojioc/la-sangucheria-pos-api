import { Supplier } from '../../domain/supplier'

export class SupplierResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly contactName: string | null,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly whatsappNumber: string | null,
    public readonly address: string | null,
    public readonly taxId: string | null,
    public readonly paymentTerms: string | null,
    public readonly notes: string | null,
    public readonly rating: number | null,
    public readonly isActive: boolean
  ) {}

  static fromDomain(supplier: Supplier): SupplierResponse {
    const primitives = supplier.toPrimitives()
    return new SupplierResponse(
      primitives.id,
      primitives.name,
      primitives.contactName,
      primitives.email,
      primitives.phone,
      primitives.whatsappNumber,
      primitives.address,
      primitives.taxId,
      primitives.paymentTerms,
      primitives.notes,
      primitives.rating,
      primitives.isActive
    )
  }
}

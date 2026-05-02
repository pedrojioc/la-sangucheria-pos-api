import { SupplierListItem } from '../../../application/dto/supplier-list-item'

export class SupplierListItemResponse {
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

  static fromReadModel(item: SupplierListItem): SupplierListItemResponse {
    return new SupplierListItemResponse(
      item.id,
      item.name,
      item.contactName,
      item.email,
      item.phone,
      item.whatsappNumber,
      item.address,
      item.taxId,
      item.paymentTerms,
      item.notes,
      item.rating,
      item.isActive
    )
  }
}

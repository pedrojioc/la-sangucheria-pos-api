import { CustomerListItem, DefaultAddressData } from '../../../application/dto/customer-list-item'

export class CustomerListItemResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly email: string | null,
    public readonly documentType: string,
    public readonly documentNumber: string,
    public readonly taxRegime: string,
    public readonly defaultAddressId: string | null,
    public readonly defaultAddress: DefaultAddressData | null,
    public readonly lifetimeValue: number,
    public readonly loyaltyPoints: number,
    public readonly notes: string | null,
    public readonly status: string
  ) {}

  static fromReadModel(item: CustomerListItem): CustomerListItemResponse {
    return new CustomerListItemResponse(
      item.id,
      item.name,
      item.phone,
      item.email,
      item.documentType,
      item.documentNumber,
      item.taxRegime,
      item.defaultAddressId,
      item.defaultAddress,
      item.lifetimeValue,
      item.loyaltyPoints,
      item.notes,
      item.status
    )
  }
}

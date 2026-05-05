export type DefaultAddressData = {
  id: string
  label: string
  street: string
  neighborhood: string | null
  city: string
  reference: string | null
  lat: number | null
  lng: number | null
}

export class CustomerListItem {
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
}

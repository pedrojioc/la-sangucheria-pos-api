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
    public readonly notes: string | null,
    public readonly status: string
  ) {}
}

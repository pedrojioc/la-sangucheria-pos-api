export class SetDefaultAddressCommand {
  constructor(
    public readonly addressId: string,
    public readonly customerId: string
  ) {}
}

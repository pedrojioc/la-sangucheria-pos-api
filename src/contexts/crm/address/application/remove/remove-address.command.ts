export class RemoveAddressCommand {
  constructor(
    public readonly id: string,
    public readonly customerId: string
  ) {}
}

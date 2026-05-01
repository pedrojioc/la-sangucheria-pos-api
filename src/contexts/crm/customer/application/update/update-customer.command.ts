import { TaxRegimeValue } from '../../domain/customer-tax-regime'

export class UpdateCustomerCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly email: string | null,
    public readonly taxRegime: TaxRegimeValue,
    public readonly notes: string | null
  ) {}
}

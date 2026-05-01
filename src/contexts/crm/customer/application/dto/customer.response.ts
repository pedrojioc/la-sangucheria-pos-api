import { DocumentTypeValue } from '../../domain/customer-document-type'
import { TaxRegimeValue } from '../../domain/customer-tax-regime'
import { CustomerStatusValue } from '../../domain/customer-status'

export class CustomerResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly email: string | null,
    public readonly documentType: DocumentTypeValue,
    public readonly documentNumber: string,
    public readonly taxRegime: TaxRegimeValue,
    public readonly defaultAddressId: string | null,
    public readonly notes: string | null,
    public readonly status: CustomerStatusValue
  ) {}
}

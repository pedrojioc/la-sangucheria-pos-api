import { BillingConfigPrimitives } from '@contexts/billing/billing-config/domain/billing-config'
import { InvoiceSnapshot } from '@contexts/billing/invoice/domain/invoice-snapshot'

export interface FactusIssueResult {
  cufeCude: string
  documentNumber: string
}

export abstract class FactusApiPort {
  abstract issue(
    config: BillingConfigPrimitives,
    snapshot: InvoiceSnapshot,
  ): Promise<FactusIssueResult>
}

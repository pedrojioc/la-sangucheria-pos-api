import { InvoicePrimitives } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'

export class ListPendingInvoices {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async run(): Promise<InvoicePrimitives[]> {
    const invoices = await this.invoiceRepository.searchPending()
    return invoices.map(invoice => invoice.toPrimitives())
  }
}

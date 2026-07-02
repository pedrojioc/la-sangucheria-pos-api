import { Invoice } from '../invoice'
import { InvoiceId } from '../invoice-id'

export abstract class InvoiceRepository {
  abstract save(invoice: Invoice): Promise<void>
  abstract search(id: InvoiceId): Promise<Invoice | null>
  abstract searchPending(): Promise<Invoice[]>
}

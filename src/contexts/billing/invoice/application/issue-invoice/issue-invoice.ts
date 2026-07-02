import { EventBus } from '@shared/domain/events/event-bus'
import { Invoice } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceSnapshot } from '@contexts/billing/invoice/domain/invoice-snapshot'
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { FactusApiPort } from '../ports/factus-api.port'

export class IssueInvoice {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly billingConfigRepository: BillingConfigRepository,
    private readonly factusApiPort: FactusApiPort,
    private readonly eventBus: EventBus,
  ) {}

  async run(id: string, snapshot: InvoiceSnapshot): Promise<void> {
    const config = await this.billingConfigRepository.findSingleton()
    const invoice = Invoice.createPending(id, snapshot)

    await this.invoiceRepository.save(invoice)

    try {
      const result = await this.factusApiPort.issue(config.toPrimitives(), snapshot)
      invoice.markIssued(result.cufeCude, result.documentNumber)
    } catch (error) {
      invoice.markFailed(error instanceof Error ? error.message : String(error))
    }

    await this.invoiceRepository.save(invoice)
    await this.eventBus.publish(invoice.pullDomainEvents())
  }
}

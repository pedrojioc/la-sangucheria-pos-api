import { EventBus } from '@shared/domain/events/event-bus'
import { InvoiceId } from '@contexts/billing/invoice/domain/invoice-id'
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'
import { InvoiceNotExist } from '@contexts/billing/invoice/domain/exceptions/invoice-not-exist.exception'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { FactusApiPort } from '../ports/factus-api.port'

export class RetryInvoice {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly billingConfigRepository: BillingConfigRepository,
    private readonly factusApiPort: FactusApiPort,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string): Promise<void> {
    const invoice = await this.invoiceRepository.search(new InvoiceId(id))
    if (!invoice) throw new InvoiceNotExist(id)

    invoice.ensureRetryable()
    invoice.resetToPending()

    const config = await this.billingConfigRepository.findSingleton()

    await this.invoiceRepository.save(invoice)

    try {
      const result = await this.factusApiPort.issue(
        config.toPrimitives(),
        invoice.toPrimitives().snapshot
      )
      invoice.markIssued(result.cufeCude, result.documentNumber)
    } catch (error) {
      invoice.markFailed(error instanceof Error ? error.message : String(error))
    }

    await this.invoiceRepository.save(invoice)
    await this.eventBus.publish(invoice.pullDomainEvents())
  }
}

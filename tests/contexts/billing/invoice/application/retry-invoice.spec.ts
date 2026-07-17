import { RetryInvoice } from '@contexts/billing/invoice/application/retry-invoice/retry-invoice'
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { FactusApiPort } from '@contexts/billing/invoice/application/ports/factus-api.port'
import { EventBus } from '@shared/domain/events/event-bus'
import { Invoice } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'
import { InvoiceNotExist } from '@contexts/billing/invoice/domain/exceptions/invoice-not-exist.exception'
import { InvoiceNotRetryable } from '@contexts/billing/invoice/domain/exceptions/invoice-not-retryable.exception'
import { InvoiceMother } from '@test/contexts/billing/invoice/__mothers__/invoice.mother'
import { BillingConfigMother } from '@test/contexts/billing/billing-config/__mothers__/billing-config.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('RetryInvoice', () => {
  let invoiceRepository: jest.Mocked<InvoiceRepository>
  let billingConfigRepository: jest.Mocked<BillingConfigRepository>
  let factusApiPort: jest.Mocked<FactusApiPort>
  let eventBus: jest.Mocked<EventBus>
  let useCase: RetryInvoice

  beforeEach(() => {
    invoiceRepository = { save: jest.fn(), search: jest.fn(), searchPending: jest.fn() } as any
    billingConfigRepository = { findSingleton: jest.fn(), save: jest.fn() } as any
    factusApiPort = { issue: jest.fn() } as any
    eventBus = { publish: jest.fn(), addSubscribers: jest.fn() } as any

    invoiceRepository.save.mockResolvedValue(undefined)
    eventBus.publish.mockResolvedValue(undefined)

    useCase = new RetryInvoice(invoiceRepository, billingConfigRepository, factusApiPort, eventBus)
  })

  it('should load a FAILED invoice, reset to PENDING, call factus, mark ISSUED, save, and publish event on success', async () => {
    const failedInvoice = InvoiceMother.failed()
    const config = BillingConfigMother.create()
    const cufeCude = 'retried-cufe-abc'
    const documentNumber = 'SETP-002'

    const savedStatuses: InvoiceStatus[] = []
    invoiceRepository.save.mockImplementation(async (invoice: Invoice) => {
      savedStatuses.push(invoice.toPrimitives().status)
    })

    invoiceRepository.search.mockResolvedValue(failedInvoice)
    billingConfigRepository.findSingleton.mockResolvedValue(config)
    factusApiPort.issue.mockResolvedValue({ cufeCude, documentNumber })

    await useCase.run(failedInvoice.id.value)

    // Should save twice: once as PENDING (after reset), once as ISSUED
    expect(invoiceRepository.save).toHaveBeenCalledTimes(2)
    expect(savedStatuses[0]).toBe(InvoiceStatus.PENDING)
    expect(savedStatuses[1]).toBe(InvoiceStatus.ISSUED)

    const finalInvoice = invoiceRepository.save.mock.calls[1][0] as Invoice
    expect(finalInvoice.toPrimitives().cufeCude).toBe(cufeCude)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const publishedEvents = eventBus.publish.mock.calls[0][0] as any[]
    expect(publishedEvents.some(e => e.constructor.name === 'InvoiceIssuedEvent')).toBe(true)
  })

  it('should throw InvoiceNotExist when the invoice is not found', async () => {
    const id = UuidMother.random()

    invoiceRepository.search.mockResolvedValue(null)

    await expect(useCase.run(id)).rejects.toThrow(InvoiceNotExist)

    expect(billingConfigRepository.findSingleton).not.toHaveBeenCalled()
    expect(factusApiPort.issue).not.toHaveBeenCalled()
  })

  it('should throw InvoiceNotRetryable when the invoice status is ISSUED', async () => {
    const issuedInvoice = InvoiceMother.issued()
    const config = BillingConfigMother.create()

    invoiceRepository.search.mockResolvedValue(issuedInvoice)
    billingConfigRepository.findSingleton.mockResolvedValue(config)

    await expect(useCase.run(issuedInvoice.id.value)).rejects.toThrow(InvoiceNotRetryable)

    expect(factusApiPort.issue).not.toHaveBeenCalled()
    expect(invoiceRepository.save).not.toHaveBeenCalled()
  })
})

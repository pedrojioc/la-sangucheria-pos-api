import { OnOrderClosedIssueBillingDocument } from '@contexts/billing/invoice/application/subscribers/on-order-closed-issue-billing-document'
import { IssueInvoice } from '@contexts/billing/invoice/application/issue-invoice/issue-invoice'
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { FactusApiPort } from '@contexts/billing/invoice/application/ports/factus-api.port'
import { EventBus } from '@shared/domain/events/event-bus'
import { Invoice, InvoicePrimitives } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'
import { BillingNotConfigured } from '@contexts/billing/billing-config/domain/exceptions/billing-not-configured.exception'
import { BillingConfigMother } from '@test/contexts/billing/billing-config/__mothers__/billing-config.mother'
import { OrderClosedEventMother } from '@test/contexts/billing/invoice/__mothers__/order-closed-event.mother'

describe('OnOrderClosedIssueBillingDocument — full vertical slice (subscriber + IssueInvoice wired)', () => {
  let invoiceRepository: jest.Mocked<InvoiceRepository>
  let billingConfigRepository: jest.Mocked<BillingConfigRepository>
  let factusApiPort: jest.Mocked<FactusApiPort>
  let eventBus: jest.Mocked<EventBus>
  let issueInvoice: IssueInvoice
  let subscriber: OnOrderClosedIssueBillingDocument

  beforeEach(() => {
    invoiceRepository = { save: jest.fn(), search: jest.fn(), searchPending: jest.fn() } as any
    billingConfigRepository = { findSingleton: jest.fn(), save: jest.fn() } as any
    factusApiPort = { issue: jest.fn() } as any
    eventBus = { publish: jest.fn(), addSubscribers: jest.fn() } as any

    invoiceRepository.save.mockResolvedValue(undefined)
    eventBus.publish.mockResolvedValue(undefined)

    // Wire the REAL IssueInvoice — not a stub
    issueInvoice = new IssueInvoice(
      invoiceRepository,
      billingConfigRepository,
      factusApiPort,
      eventBus
    )
    subscriber = new OnOrderClosedIssueBillingDocument(issueInvoice)
  })

  it('should save invoice as PENDING then ISSUED and publish InvoiceIssuedEvent on Factus success', async () => {
    const config = BillingConfigMother.create()
    const cufeCude = 'CUFE-123'
    const documentNumber = 'FE-001'

    billingConfigRepository.findSingleton.mockResolvedValue(config)
    factusApiPort.issue.mockResolvedValue({ cufeCude, documentNumber })

    const savedInvoices: InvoicePrimitives[] = []
    invoiceRepository.save = jest.fn().mockImplementation((invoice: Invoice) => {
      savedInvoices.push(invoice.toPrimitives())
      return Promise.resolve()
    })

    await subscriber.on(OrderClosedEventMother.anonymous())

    expect(invoiceRepository.save).toHaveBeenCalledTimes(2)
    expect(savedInvoices[0].status).toBe(InvoiceStatus.PENDING)
    expect(savedInvoices[1].status).toBe(InvoiceStatus.ISSUED)
    expect(savedInvoices[1].cufeCude).toBe(cufeCude)

    const publishedEvents = eventBus.publish.mock.calls[0][0] as any[]
    expect(publishedEvents.some(e => e.constructor.name === 'InvoiceIssuedEvent')).toBe(true)
  })

  it('should save invoice as PENDING then FAILED and publish InvoiceFailedEvent on Factus failure', async () => {
    const config = BillingConfigMother.create()
    billingConfigRepository.findSingleton.mockResolvedValue(config)
    factusApiPort.issue.mockRejectedValue(new Error('503 Service Unavailable'))

    const savedInvoices: InvoicePrimitives[] = []
    invoiceRepository.save = jest.fn().mockImplementation((invoice: Invoice) => {
      savedInvoices.push(invoice.toPrimitives())
      return Promise.resolve()
    })

    await expect(subscriber.on(OrderClosedEventMother.anonymous())).resolves.toBeUndefined()

    expect(invoiceRepository.save).toHaveBeenCalledTimes(2)
    expect(savedInvoices[0].status).toBe(InvoiceStatus.PENDING)
    expect(savedInvoices[1].status).toBe(InvoiceStatus.FAILED)
    expect(savedInvoices[1].failureReason).toContain('503')

    const publishedEvents = eventBus.publish.mock.calls[0][0] as any[]
    expect(publishedEvents.some(e => e.constructor.name === 'InvoiceFailedEvent')).toBe(true)
  })

  it('should persist invoice as FAILED with billing_not_configured reason when billing is not configured', async () => {
    billingConfigRepository.findSingleton.mockRejectedValue(new BillingNotConfigured())

    const savedInvoices: InvoicePrimitives[] = []
    invoiceRepository.save = jest.fn().mockImplementation((invoice: Invoice) => {
      savedInvoices.push(invoice.toPrimitives())
      return Promise.resolve()
    })

    await expect(subscriber.on(OrderClosedEventMother.anonymous())).resolves.toBeUndefined()

    expect(invoiceRepository.save).toHaveBeenCalledTimes(2)
    expect(savedInvoices[0].status).toBe(InvoiceStatus.PENDING)
    expect(savedInvoices[1].status).toBe(InvoiceStatus.FAILED)
    expect(savedInvoices[1].failureReason).toBe('billing_not_configured')

    expect(factusApiPort.issue).not.toHaveBeenCalled()
    expect(eventBus.publish).toHaveBeenCalledTimes(1)
  })
})

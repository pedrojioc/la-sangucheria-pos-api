import { RetryInvoice } from '@contexts/billing/invoice/application/retry-invoice/retry-invoice'
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { FactusApiPort } from '@contexts/billing/invoice/application/ports/factus-api.port'
import { EventBus } from '@shared/domain/events/event-bus'
import { Invoice } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'
import { InvoiceMother, InvoiceSnapshotMother } from '@test/contexts/billing/invoice/__mothers__/invoice.mother'
import { BillingConfigMother } from '@test/contexts/billing/billing-config/__mothers__/billing-config.mother'

describe('RetryInvoice — snapshot isolation and status transitions', () => {
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

  it('should call FactusApiPort with the snapshot stored in the FAILED invoice — not any external data', async () => {
    // Arrange — create a FAILED invoice with a specific snapshot
    const specificSnapshot = InvoiceSnapshotMother.create({
      orderId: 'order-abc-123',
      orderNumber: 9876,
      subtotal: 55000,
      taxAmount: 10450,
    })
    const failedInvoice = InvoiceMother.failed({ snapshot: specificSnapshot })
    const config = BillingConfigMother.create()

    invoiceRepository.search.mockResolvedValue(failedInvoice)
    billingConfigRepository.findSingleton.mockResolvedValue(config)
    factusApiPort.issue.mockResolvedValue({ cufeCude: 'new-cufe', documentNumber: 'DOC-001' })

    // Act
    await useCase.run(failedInvoice.id.value)

    // Assert — Factus was called with the exact snapshot from the stored invoice
    expect(factusApiPort.issue).toHaveBeenCalledTimes(1)
    const [, passedSnapshot] = factusApiPort.issue.mock.calls[0]
    expect(passedSnapshot.orderId).toBe(specificSnapshot.orderId)
    expect(passedSnapshot.orderNumber).toBe(specificSnapshot.orderNumber)
    expect(passedSnapshot.subtotal).toBe(specificSnapshot.subtotal)
    expect(passedSnapshot.taxAmount).toBe(specificSnapshot.taxAmount)

    // Assert — no additional repo consulted beyond invoiceRepository and billingConfigRepository
    expect(invoiceRepository.search).toHaveBeenCalledTimes(1)
    expect(billingConfigRepository.findSingleton).toHaveBeenCalledTimes(1)
  })

  it('should save invoice as ISSUED with the new cufeCude when retry succeeds', async () => {
    // Arrange
    const failedInvoice = InvoiceMother.failed()
    const config = BillingConfigMother.create()
    const newCufeCude = 'retry-cufe-xyz'
    const newDocumentNumber = 'DOC-RETRY-001'

    const savedStatuses: InvoiceStatus[] = []
    invoiceRepository.save = jest.fn().mockImplementation((invoice: Invoice) => {
      savedStatuses.push(invoice.toPrimitives().status)
      return Promise.resolve()
    })

    invoiceRepository.search.mockResolvedValue(failedInvoice)
    billingConfigRepository.findSingleton.mockResolvedValue(config)
    factusApiPort.issue.mockResolvedValue({ cufeCude: newCufeCude, documentNumber: newDocumentNumber })

    // Act
    await useCase.run(failedInvoice.id.value)

    // Assert — saved twice: PENDING (reset), then ISSUED
    expect(invoiceRepository.save).toHaveBeenCalledTimes(2)
    expect(savedStatuses[0]).toBe(InvoiceStatus.PENDING)
    expect(savedStatuses[1]).toBe(InvoiceStatus.ISSUED)

    const finalInvoice = invoiceRepository.save.mock.calls[1][0] as Invoice
    expect(finalInvoice.toPrimitives().cufeCude).toBe(newCufeCude)
    expect(finalInvoice.toPrimitives().factusDocumentNumber).toBe(newDocumentNumber)
  })

  it('should save invoice as FAILED with incremented attempts when retry fails again', async () => {
    // Arrange — failed invoice already has 1 attempt (from markFailed in mother)
    const failedInvoice = InvoiceMother.failed()
    const previousAttempts = failedInvoice.toPrimitives().attempts
    const config = BillingConfigMother.create()

    invoiceRepository.search.mockResolvedValue(failedInvoice)
    billingConfigRepository.findSingleton.mockResolvedValue(config)
    factusApiPort.issue.mockRejectedValue(new Error('Timeout again'))

    const savedStatuses: InvoiceStatus[] = []
    invoiceRepository.save = jest.fn().mockImplementation((invoice: Invoice) => {
      savedStatuses.push(invoice.toPrimitives().status)
      return Promise.resolve()
    })

    // Act
    await useCase.run(failedInvoice.id.value)

    // Assert — saved twice: PENDING (reset), then FAILED again with incremented attempts
    expect(invoiceRepository.save).toHaveBeenCalledTimes(2)
    expect(savedStatuses[0]).toBe(InvoiceStatus.PENDING)
    expect(savedStatuses[1]).toBe(InvoiceStatus.FAILED)

    const finalInvoice = invoiceRepository.save.mock.calls[1][0] as Invoice
    expect(finalInvoice.toPrimitives().attempts).toBeGreaterThan(previousAttempts)
  })
})

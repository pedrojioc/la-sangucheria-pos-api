import { IssueInvoice } from '@contexts/billing/invoice/application/issue-invoice/issue-invoice'
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { FactusApiPort } from '@contexts/billing/invoice/application/ports/factus-api.port'
import { EventBus } from '@shared/domain/events/event-bus'
import { Invoice } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'
import { BillingNotConfigured } from '@contexts/billing/billing-config/domain/exceptions/billing-not-configured.exception'
import { InvoiceSnapshotMother } from '@test/contexts/billing/invoice/__mothers__/invoice.mother'
import { BillingConfigMother } from '@test/contexts/billing/billing-config/__mothers__/billing-config.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('IssueInvoice', () => {
  let invoiceRepository: jest.Mocked<InvoiceRepository>
  let billingConfigRepository: jest.Mocked<BillingConfigRepository>
  let factusApiPort: jest.Mocked<FactusApiPort>
  let eventBus: jest.Mocked<EventBus>
  let useCase: IssueInvoice

  beforeEach(() => {
    invoiceRepository = { save: jest.fn(), search: jest.fn(), searchPending: jest.fn() } as any
    billingConfigRepository = { findSingleton: jest.fn(), save: jest.fn() } as any
    factusApiPort = { issue: jest.fn() } as any
    eventBus = { publish: jest.fn(), addSubscribers: jest.fn() } as any

    invoiceRepository.save.mockResolvedValue(undefined)
    eventBus.publish.mockResolvedValue(undefined)

    useCase = new IssueInvoice(invoiceRepository, billingConfigRepository, factusApiPort, eventBus)
  })

  it('should create a PENDING invoice, call factus, mark as ISSUED, and publish InvoiceIssuedEvent on success', async () => {
    const config = BillingConfigMother.create()
    const snapshot = InvoiceSnapshotMother.create()
    const invoiceId = UuidMother.random()
    const cufeCude = 'abc123cufecude'
    const documentNumber = 'SETP-001'

    const savedStatuses: InvoiceStatus[] = []
    invoiceRepository.save.mockImplementation(async (invoice: Invoice) => {
      savedStatuses.push(invoice.toPrimitives().status)
    })

    billingConfigRepository.findSingleton.mockResolvedValue(config)
    factusApiPort.issue.mockResolvedValue({ cufeCude, documentNumber })

    await useCase.run(invoiceId, snapshot)

    // Should save twice: once as PENDING, once as ISSUED
    expect(invoiceRepository.save).toHaveBeenCalledTimes(2)
    expect(savedStatuses[0]).toBe(InvoiceStatus.PENDING)
    expect(savedStatuses[1]).toBe(InvoiceStatus.ISSUED)

    // Final state has cufeCude and documentNumber
    const finalInvoice = invoiceRepository.save.mock.calls[1][0] as Invoice
    expect(finalInvoice.toPrimitives().cufeCude).toBe(cufeCude)
    expect(finalInvoice.toPrimitives().factusDocumentNumber).toBe(documentNumber)

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const publishedEvents = (eventBus.publish.mock.calls[0][0] as any[])
    expect(publishedEvents.some((e) => e.constructor.name === 'InvoiceIssuedEvent')).toBe(true)
  })

  it('should create a PENDING invoice, mark as FAILED, and publish InvoiceFailedEvent on factus error', async () => {
    const config = BillingConfigMother.create()
    const snapshot = InvoiceSnapshotMother.create()
    const invoiceId = UuidMother.random()

    const savedStatuses: InvoiceStatus[] = []
    invoiceRepository.save.mockImplementation(async (invoice: Invoice) => {
      savedStatuses.push(invoice.toPrimitives().status)
    })

    billingConfigRepository.findSingleton.mockResolvedValue(config)
    factusApiPort.issue.mockRejectedValue(new Error('Factus service unavailable'))

    await useCase.run(invoiceId, snapshot)

    // Should save twice: once as PENDING, once as FAILED
    expect(invoiceRepository.save).toHaveBeenCalledTimes(2)
    expect(savedStatuses[0]).toBe(InvoiceStatus.PENDING)
    expect(savedStatuses[1]).toBe(InvoiceStatus.FAILED)

    // Final state has the failure reason
    const finalInvoice = invoiceRepository.save.mock.calls[1][0] as Invoice
    expect(finalInvoice.toPrimitives().failureReason).toBe('Factus service unavailable')

    expect(eventBus.publish).toHaveBeenCalledTimes(1)
    const publishedEvents = (eventBus.publish.mock.calls[0][0] as any[])
    expect(publishedEvents.some((e) => e.constructor.name === 'InvoiceFailedEvent')).toBe(true)
  })

  it('should propagate BillingNotConfigured when billing is not configured', async () => {
    const snapshot = InvoiceSnapshotMother.create()
    const invoiceId = UuidMother.random()

    billingConfigRepository.findSingleton.mockRejectedValue(new BillingNotConfigured())

    await expect(useCase.run(invoiceId, snapshot)).rejects.toThrow(BillingNotConfigured)

    expect(invoiceRepository.save).not.toHaveBeenCalled()
    expect(factusApiPort.issue).not.toHaveBeenCalled()
  })
})

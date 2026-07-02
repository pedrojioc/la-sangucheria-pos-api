import { OnOrderClosedIssueBillingDocument } from '@contexts/billing/invoice/application/subscribers/on-order-closed-issue-billing-document'
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { IssueInvoice } from '@contexts/billing/invoice/application/issue-invoice/issue-invoice'
import { BillingNotConfigured } from '@contexts/billing/billing-config/domain/exceptions/billing-not-configured.exception'
import { DocumentType } from '@contexts/billing/invoice/domain/document-type'
import { BillingConfigMother } from '@test/contexts/billing/billing-config/__mothers__/billing-config.mother'
import { OrderClosedEventMother } from '@test/contexts/billing/invoice/__mothers__/order-closed-event.mother'

describe('OnOrderClosedIssueBillingDocument', () => {
  let billingConfigRepository: jest.Mocked<BillingConfigRepository>
  let issueInvoice: jest.Mocked<IssueInvoice>
  let subscriber: OnOrderClosedIssueBillingDocument

  beforeEach(() => {
    billingConfigRepository = { findSingleton: jest.fn(), save: jest.fn() } as any
    issueInvoice = { run: jest.fn() } as any

    issueInvoice.run.mockResolvedValue(undefined)

    subscriber = new OnOrderClosedIssueBillingDocument(billingConfigRepository, issueInvoice)
  })

  it('should return silently without calling issueInvoice when billing is not configured', async () => {
    billingConfigRepository.findSingleton.mockRejectedValue(new BillingNotConfigured())

    const event = OrderClosedEventMother.anonymous()

    await subscriber.on(event)

    expect(issueInvoice.run).not.toHaveBeenCalled()
  })

  it('should call issueInvoice with DOCUMENTO_EQUIVALENTE when customer fields are null', async () => {
    const config = BillingConfigMother.create()
    billingConfigRepository.findSingleton.mockResolvedValue(config)

    const event = OrderClosedEventMother.anonymous()

    await subscriber.on(event)

    expect(issueInvoice.run).toHaveBeenCalledTimes(1)
    const [, snapshot] = issueInvoice.run.mock.calls[0]
    expect(snapshot.documentType).toBe(DocumentType.DOCUMENTO_EQUIVALENTE)
    expect(snapshot.customerDocumentType).toBeNull()
    expect(snapshot.customerDocumentNumber).toBeNull()
  })

  it('should call issueInvoice with FACTURA_NOMBRADA when customer fields are present', async () => {
    const config = BillingConfigMother.create()
    billingConfigRepository.findSingleton.mockResolvedValue(config)

    const event = OrderClosedEventMother.withCustomer('900123456', 'NIT')

    await subscriber.on(event)

    expect(issueInvoice.run).toHaveBeenCalledTimes(1)
    const [, snapshot] = issueInvoice.run.mock.calls[0]
    expect(snapshot.documentType).toBe(DocumentType.FACTURA_NOMBRADA)
    expect(snapshot.customerDocumentType).toBe('NIT')
    expect(snapshot.customerDocumentNumber).toBe('900123456')
  })

  it('should rethrow unexpected errors from billingConfigRepository', async () => {
    const unexpectedError = new Error('Database connection lost')
    billingConfigRepository.findSingleton.mockRejectedValue(unexpectedError)

    const event = OrderClosedEventMother.anonymous()

    await expect(subscriber.on(event)).rejects.toThrow('Database connection lost')

    expect(issueInvoice.run).not.toHaveBeenCalled()
  })

  it('should map snapshot fields correctly from the OrderClosedEvent payload', async () => {
    const config = BillingConfigMother.create()
    billingConfigRepository.findSingleton.mockResolvedValue(config)

    const event = OrderClosedEventMother.create({
      total: 50000,
      subtotal: 42017,
      discountTotal: 5000,
      taxBase: 42017,
      taxAmount: 7983,
      taxConfig: { rate: 0.19, type: 'IVA', inclusive: true },
    })

    await subscriber.on(event)

    expect(issueInvoice.run).toHaveBeenCalledTimes(1)
    const [, snapshot] = issueInvoice.run.mock.calls[0]
    expect(snapshot.subtotal).toBe(42017)
    expect(snapshot.discountTotal).toBe(5000)
    expect(snapshot.taxBase).toBe(42017)
    expect(snapshot.taxAmount).toBe(7983)
    expect(snapshot.taxConfig.name).toBe('IVA')
    expect(snapshot.taxConfig.rate).toBe(0.19)
    expect(snapshot.taxConfig.inclusive).toBe(true)
  })
})

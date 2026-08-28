import { IssueBillingDocumentOnOrderClosed } from '@contexts/billing/invoice/application/subscribers/issue-billing-document-on-order-closed'
import { IssueInvoice } from '@contexts/billing/invoice/application/issue-invoice/issue-invoice'
import { DocumentType } from '@contexts/billing/invoice/domain/document-type'
import { OrderClosedEventMother } from '@test/contexts/billing/invoice/__mothers__/order-closed-event.mother'

describe('IssueBillingDocumentOnOrderClosed', () => {
  let issueInvoice: jest.Mocked<IssueInvoice>
  let subscriber: IssueBillingDocumentOnOrderClosed

  beforeEach(() => {
    issueInvoice = { run: jest.fn() } as any
    issueInvoice.run.mockResolvedValue(undefined)

    subscriber = new IssueBillingDocumentOnOrderClosed(issueInvoice)
  })

  it('should always call issueInvoice — BillingNotConfigured is handled inside IssueInvoice', async () => {
    const event = OrderClosedEventMother.anonymous()

    await subscriber.on(event)

    expect(issueInvoice.run).toHaveBeenCalledTimes(1)
  })

  it('should call issueInvoice with DOCUMENTO_EQUIVALENTE when customer fields are null', async () => {
    const event = OrderClosedEventMother.anonymous()

    await subscriber.on(event)

    expect(issueInvoice.run).toHaveBeenCalledTimes(1)
    const [, snapshot] = issueInvoice.run.mock.calls[0]
    expect(snapshot.documentType).toBe(DocumentType.DOCUMENTO_EQUIVALENTE)
    expect(snapshot.customerDocumentType).toBeNull()
    expect(snapshot.customerDocumentNumber).toBeNull()
  })

  it('should call issueInvoice with FACTURA_NOMBRADA when customer fields are present', async () => {
    const event = OrderClosedEventMother.withCustomer('900123456', 'NIT')

    await subscriber.on(event)

    expect(issueInvoice.run).toHaveBeenCalledTimes(1)
    const [, snapshot] = issueInvoice.run.mock.calls[0]
    expect(snapshot.documentType).toBe(DocumentType.FACTURA_NOMBRADA)
    expect(snapshot.customerDocumentType).toBe('NIT')
    expect(snapshot.customerDocumentNumber).toBe('900123456')
  })

  it('should map snapshot fields correctly from the OrderClosedEvent payload', async () => {
    const event = OrderClosedEventMother.create({
      total: 50000,
      subtotal: 42017,
      discountTotal: 5000,
      taxBase: 42017,
      taxAmount: 7983,
      taxConfig: { rate: 0.19, type: 'IVA', inclusive: true }
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

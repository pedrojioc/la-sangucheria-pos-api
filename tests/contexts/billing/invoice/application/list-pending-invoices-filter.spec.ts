import { ListPendingInvoices } from '@contexts/billing/invoice/application/list-pending-invoices/list-pending-invoices'
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'
import { InvoiceMother } from '@test/contexts/billing/invoice/__mothers__/invoice.mother'

describe('ListPendingInvoices — searchPending delegation and primitives mapping', () => {
  let invoiceRepository: jest.Mocked<InvoiceRepository>
  let useCase: ListPendingInvoices

  beforeEach(() => {
    invoiceRepository = { save: jest.fn(), search: jest.fn(), searchPending: jest.fn() } as any
    useCase = new ListPendingInvoices(invoiceRepository)
  })

  it('should call searchPending (not search) and return all results as primitives', async () => {
    // Arrange
    const pendingInvoice = InvoiceMother.pending()
    const failedInvoice = InvoiceMother.failed()

    invoiceRepository.searchPending.mockResolvedValue([pendingInvoice, failedInvoice])

    // Act
    const result = await useCase.run()

    // Assert — used the correct repo method
    expect(invoiceRepository.searchPending).toHaveBeenCalledTimes(1)
    expect(invoiceRepository.search).not.toHaveBeenCalled()

    // Assert — both invoices returned as primitives
    expect(result).toHaveLength(2)
    expect(result[0].status).toBe(InvoiceStatus.PENDING)
    expect(result[1].status).toBe(InvoiceStatus.FAILED)
    expect(result[0].id).toBe(pendingInvoice.id.value)
    expect(result[1].id).toBe(failedInvoice.id.value)
  })

  it('should return an empty array when searchPending returns no results', async () => {
    // Arrange
    invoiceRepository.searchPending.mockResolvedValue([])

    // Act
    const result = await useCase.run()

    // Assert
    expect(result).toHaveLength(0)
    expect(Array.isArray(result)).toBe(true)
  })

  it('should map all required primitive fields correctly for a FAILED invoice', async () => {
    // Arrange
    const snapshot = {
      orderId: 'order-primitive-test',
      orderNumber: 42,
      documentType: 'DOCUMENTO_EQUIVALENTE' as any,
      subtotal: 30000,
      discountTotal: 0,
      taxBase: 30000,
      taxAmount: 5700,
      taxConfig: { name: 'IVA', rate: 19, inclusive: true },
      items: [],
      customerDocumentType: null,
      customerDocumentNumber: null,
      closedAt: new Date('2025-06-01'),
      currency: 'COP'
    }
    const failedInvoice = InvoiceMother.failed({ snapshot, failureReason: 'Network timeout' })

    invoiceRepository.searchPending.mockResolvedValue([failedInvoice])

    // Act
    const result = await useCase.run()

    // Assert — primitives contain key fields
    expect(result).toHaveLength(1)
    const primitive = result[0]
    expect(primitive.status).toBe(InvoiceStatus.FAILED)
    expect(primitive.snapshot.orderId).toBe('order-primitive-test') // orderId is nested inside snapshot
    expect(primitive.snapshot.subtotal).toBe(30000)
    expect(primitive.failureReason).toBe('Network timeout')
    expect(primitive.attempts).toBeGreaterThan(0)
    expect(primitive.cufeCude).toBeNull()
    expect(primitive.factusDocumentNumber).toBeNull()
  })
})

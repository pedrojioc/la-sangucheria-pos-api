import { ListPendingInvoices } from '@contexts/billing/invoice/application/list-pending-invoices/list-pending-invoices'
import { InvoiceRepository } from '@contexts/billing/invoice/domain/repositories/invoice.repository'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'
import { InvoiceMother } from '@test/contexts/billing/invoice/__mothers__/invoice.mother'

describe('ListPendingInvoices', () => {
  let invoiceRepository: jest.Mocked<InvoiceRepository>
  let useCase: ListPendingInvoices

  beforeEach(() => {
    invoiceRepository = { save: jest.fn(), search: jest.fn(), searchPending: jest.fn() } as any
    useCase = new ListPendingInvoices(invoiceRepository)
  })

  it('should return mapped primitives for all pending (and failed) invoices', async () => {
    const pending = InvoiceMother.pending()
    const failed = InvoiceMother.failed()

    invoiceRepository.searchPending.mockResolvedValue([pending, failed])

    const result = await useCase.run()

    expect(result).toHaveLength(2)
    expect(result[0].status).toBe(InvoiceStatus.PENDING)
    expect(result[1].status).toBe(InvoiceStatus.FAILED)
    expect(result[0].id).toBe(pending.id.value)
    expect(result[1].id).toBe(failed.id.value)
  })

  it('should return an empty array when there are no pending invoices', async () => {
    invoiceRepository.searchPending.mockResolvedValue([])

    const result = await useCase.run()

    expect(result).toHaveLength(0)
    expect(result).toEqual([])
  })
})

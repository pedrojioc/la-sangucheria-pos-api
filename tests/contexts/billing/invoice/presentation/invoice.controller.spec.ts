import { NotFoundException, UnprocessableEntityException } from '@nestjs/common'

import { InvoiceController } from '@contexts/billing/invoice/presentation/invoice.controller'
import { ListPendingInvoices } from '@contexts/billing/invoice/application/list-pending-invoices/list-pending-invoices'
import { RetryInvoice } from '@contexts/billing/invoice/application/retry-invoice/retry-invoice'
import { InvoiceNotExist } from '@contexts/billing/invoice/domain/exceptions/invoice-not-exist.exception'
import { InvoiceNotRetryable } from '@contexts/billing/invoice/domain/exceptions/invoice-not-retryable.exception'
import { InvoiceResponse } from '@contexts/billing/invoice/application/dto/invoice.response'
import { InvoiceMother } from '../__mothers__/invoice.mother'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'

describe('InvoiceController', () => {
  let controller: InvoiceController
  let mockListPendingInvoices: jest.Mocked<ListPendingInvoices>
  let mockRetryInvoice: jest.Mocked<RetryInvoice>

  beforeEach(() => {
    mockListPendingInvoices = {
      run: jest.fn()
    } as unknown as jest.Mocked<ListPendingInvoices>

    mockRetryInvoice = {
      run: jest.fn()
    } as unknown as jest.Mocked<RetryInvoice>

    controller = new InvoiceController(mockListPendingInvoices, mockRetryInvoice)
  })

  describe('GET /invoices/pending', () => {
    it('should return array of InvoiceResponse', async () => {
      // Arrange
      const pending = InvoiceMother.primitives({ status: InvoiceStatus.PENDING })
      const failed = InvoiceMother.primitives({ status: InvoiceStatus.FAILED })
      mockListPendingInvoices.run.mockResolvedValue([pending, failed])

      // Act
      const result = await controller.listPending()

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0]).toBeInstanceOf(InvoiceResponse)
      expect(result[0].id).toBe(pending.id)
      expect(result[0].status).toBe(pending.status)
      expect(result[1].id).toBe(failed.id)
      expect(result[1].status).toBe(failed.status)
      expect(mockListPendingInvoices.run).toHaveBeenCalledTimes(1)
    })

    it('should return empty array when no pending invoices', async () => {
      // Arrange
      mockListPendingInvoices.run.mockResolvedValue([])

      // Act
      const result = await controller.listPending()

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('POST /invoices/:id/retry', () => {
    it('should return no content on successful retry', async () => {
      // Arrange
      const invoiceId = 'some-uuid'
      mockRetryInvoice.run.mockResolvedValue(undefined)

      // Act
      const result = await controller.retry(invoiceId)

      // Assert
      expect(result).toBeUndefined()
      expect(mockRetryInvoice.run).toHaveBeenCalledWith(invoiceId)
    })

    it('should throw NotFoundException when InvoiceNotExist is thrown', async () => {
      // Arrange
      const invoiceId = 'non-existent-id'
      mockRetryInvoice.run.mockRejectedValue(new InvoiceNotExist(invoiceId))

      // Act & Assert
      await expect(controller.retry(invoiceId)).rejects.toThrow(NotFoundException)
    })

    it('should throw UnprocessableEntityException when InvoiceNotRetryable is thrown', async () => {
      // Arrange
      const invoiceId = 'some-uuid'
      mockRetryInvoice.run.mockRejectedValue(new InvoiceNotRetryable(InvoiceStatus.ISSUED))

      // Act & Assert
      await expect(controller.retry(invoiceId)).rejects.toThrow(UnprocessableEntityException)
    })

    it('should rethrow unexpected errors', async () => {
      // Arrange
      const invoiceId = 'some-uuid'
      const unexpectedError = new Error('Database connection lost')
      mockRetryInvoice.run.mockRejectedValue(unexpectedError)

      // Act & Assert
      await expect(controller.retry(invoiceId)).rejects.toThrow('Database connection lost')
    })
  })
})

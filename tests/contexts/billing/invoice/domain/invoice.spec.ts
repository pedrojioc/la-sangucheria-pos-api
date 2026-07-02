import { Invoice } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'
import { DocumentType } from '@contexts/billing/invoice/domain/document-type'
import { InvoiceIssuedEvent } from '@contexts/billing/invoice/domain/events/invoice-issued.event'
import { InvoiceFailedEvent } from '@contexts/billing/invoice/domain/events/invoice-failed.event'
import { InvoiceNotRetryable } from '@contexts/billing/invoice/domain/exceptions/invoice-not-retryable.exception'
import { InvoiceMother, InvoiceSnapshotMother } from '../__mothers__/invoice.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('Invoice', () => {
  describe('createPending()', () => {
    it('should create an invoice with PENDING status and attempts = 0', () => {
      // Arrange
      const id = UuidMother.random()
      const snapshot = InvoiceSnapshotMother.create()

      // Act
      const invoice = Invoice.createPending(id, snapshot)

      // Assert
      const primitives = invoice.toPrimitives()
      expect(primitives.status).toBe(InvoiceStatus.PENDING)
      expect(primitives.attempts).toBe(0)
      expect(primitives.cufeCude).toBeNull()
      expect(primitives.factusDocumentNumber).toBeNull()
      expect(primitives.failureReason).toBeNull()
    })

    it('should NOT record any domain event on creation', () => {
      // Arrange
      const invoice = InvoiceMother.pending()

      // Act
      const events = invoice.pullDomainEvents()

      // Assert
      expect(events).toHaveLength(0)
    })
  })

  describe('markIssued()', () => {
    it('should set status to ISSUED and record InvoiceIssuedEvent', () => {
      // Arrange
      const invoice = InvoiceMother.pending()
      const cufeCude = 'abc123cufe'
      const documentNumber = 'SETP-1001'

      // Act
      invoice.markIssued(cufeCude, documentNumber)

      // Assert
      const primitives = invoice.toPrimitives()
      expect(primitives.status).toBe(InvoiceStatus.ISSUED)
      expect(primitives.cufeCude).toBe(cufeCude)
      expect(primitives.factusDocumentNumber).toBe(documentNumber)

      const events = invoice.pullDomainEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(InvoiceIssuedEvent)

      const eventPayload = (events[0] as InvoiceIssuedEvent).toPrimitives()
      expect(eventPayload.cufeCude).toBe(cufeCude)
      expect(eventPayload.documentNumber).toBe(documentNumber)
      expect(eventPayload.documentType).toBe(DocumentType.DOCUMENTO_EQUIVALENTE)
    })
  })

  describe('markFailed()', () => {
    it('should set status to FAILED, increment attempts, and record InvoiceFailedEvent', () => {
      // Arrange
      const invoice = InvoiceMother.pending()
      const reason = 'Factus returned 500'

      // Act
      invoice.markFailed(reason)

      // Assert
      const primitives = invoice.toPrimitives()
      expect(primitives.status).toBe(InvoiceStatus.FAILED)
      expect(primitives.attempts).toBe(1)
      expect(primitives.failureReason).toBe(reason)

      const events = invoice.pullDomainEvents()
      expect(events).toHaveLength(1)
      expect(events[0]).toBeInstanceOf(InvoiceFailedEvent)

      const eventPayload = (events[0] as InvoiceFailedEvent).toPrimitives()
      expect(eventPayload.reason).toBe(reason)
      expect(eventPayload.attempts).toBe(1)
    })

    it('should increment attempts to 2 when called twice', () => {
      // Arrange
      const invoice = InvoiceMother.pending()

      // Act
      invoice.markFailed('first failure')
      invoice.markFailed('second failure')

      // Assert
      expect(invoice.toPrimitives().attempts).toBe(2)
    })
  })

  describe('ensureRetryable()', () => {
    it('should NOT throw when status is FAILED', () => {
      // Arrange
      const invoice = InvoiceMother.failed()

      // Act & Assert
      expect(() => invoice.ensureRetryable()).not.toThrow()
    })

    it('should throw InvoiceNotRetryable when status is ISSUED', () => {
      // Arrange
      const invoice = InvoiceMother.issued()

      // Act & Assert
      expect(() => invoice.ensureRetryable()).toThrow(InvoiceNotRetryable)
    })

    it('should throw InvoiceNotRetryable when status is PENDING', () => {
      // Arrange
      const invoice = InvoiceMother.pending()

      // Act & Assert
      expect(() => invoice.ensureRetryable()).toThrow(InvoiceNotRetryable)
    })
  })

  describe('resetToPending()', () => {
    it('should set status back to PENDING from FAILED', () => {
      // Arrange
      const invoice = InvoiceMother.failed()

      // Act
      invoice.resetToPending()

      // Assert
      expect(invoice.toPrimitives().status).toBe(InvoiceStatus.PENDING)
    })
  })

  describe('isIssued()', () => {
    it('should return true when status is ISSUED', () => {
      // Arrange
      const invoice = InvoiceMother.issued()

      // Act & Assert
      expect(invoice.isIssued()).toBe(true)
    })

    it('should return false when status is PENDING', () => {
      // Arrange
      const invoice = InvoiceMother.pending()

      // Act & Assert
      expect(invoice.isIssued()).toBe(false)
    })

    it('should return false when status is FAILED', () => {
      // Arrange
      const invoice = InvoiceMother.failed()

      // Act & Assert
      expect(invoice.isIssued()).toBe(false)
    })
  })

  describe('fromPrimitives() round-trip', () => {
    it('should preserve all fields when reconstructed from primitives', () => {
      // Arrange
      const snapshot = InvoiceSnapshotMother.create({
        documentType: DocumentType.FACTURA_NOMBRADA,
        customerDocumentType: 'CC',
        customerDocumentNumber: '123456789'
      })
      const original = Invoice.createPending(UuidMother.random(), snapshot)
      original.markIssued('cufe-xyz', 'SETP-5001')

      // Capture state before round-trip
      const originalPrimitives = original.toPrimitives()

      // Act
      const reconstructed = Invoice.fromPrimitives(originalPrimitives)

      // Assert
      const reconstructedPrimitives = reconstructed.toPrimitives()
      expect(reconstructedPrimitives.id).toBe(originalPrimitives.id)
      expect(reconstructedPrimitives.status).toBe(InvoiceStatus.ISSUED)
      expect(reconstructedPrimitives.cufeCude).toBe('cufe-xyz')
      expect(reconstructedPrimitives.factusDocumentNumber).toBe('SETP-5001')
      expect(reconstructedPrimitives.attempts).toBe(0)
      expect(reconstructedPrimitives.snapshot.orderId).toBe(originalPrimitives.snapshot.orderId)
      expect(reconstructedPrimitives.snapshot.customerDocumentType).toBe('CC')
      expect(reconstructedPrimitives.snapshot.customerDocumentNumber).toBe('123456789')
      expect(reconstructedPrimitives.documentType).toBe(DocumentType.FACTURA_NOMBRADA)
    })
  })
})

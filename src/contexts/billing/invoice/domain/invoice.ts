import { AggregateRoot } from '@shared/domain/aggregate-root'
import { InvoiceId } from './invoice-id'
import { CufeCude } from './cufe-cude'
import { FactusDocumentNumber } from './factus-document-number'
import { FailureReason } from './failure-reason'
import { InvoiceStatus } from './invoice-status'
import { DocumentType } from './document-type'
import { InvoiceSnapshot } from './invoice-snapshot'
import { InvoiceNotRetryable } from './exceptions/invoice-not-retryable.exception'
import { InvoiceIssuedEvent } from './events/invoice-issued.event'
import { InvoiceFailedEvent } from './events/invoice-failed.event'

export interface InvoicePrimitives {
  id: string
  snapshot: InvoiceSnapshot
  documentType: DocumentType
  status: InvoiceStatus
  cufeCude: string | null
  factusDocumentNumber: string | null
  failureReason: string | null
  attempts: number
  createdAt: Date
  updatedAt: Date
}

export class Invoice extends AggregateRoot {
  private constructor(
    public readonly id: InvoiceId,
    private readonly snapshot: InvoiceSnapshot,
    private readonly documentType: DocumentType,
    private status: InvoiceStatus,
    private cufeCude: CufeCude | null,
    private factusDocumentNumber: FactusDocumentNumber | null,
    private failureReason: FailureReason | null,
    private attempts: number,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super()
  }

  static createPending(id: string, snapshot: InvoiceSnapshot): Invoice {
    return new Invoice(
      new InvoiceId(id),
      snapshot,
      snapshot.documentType,
      InvoiceStatus.PENDING,
      null,
      null,
      null,
      0,
      new Date(),
      new Date()
    )
  }

  markIssued(cufeCude: string, documentNumber: string): void {
    this.status = InvoiceStatus.ISSUED
    this.cufeCude = new CufeCude(cufeCude)
    this.factusDocumentNumber = new FactusDocumentNumber(documentNumber)
    this.updatedAt = new Date()

    this.record(
      new InvoiceIssuedEvent({
        invoiceId: this.id.value,
        orderId: this.snapshot.orderId,
        cufeCude,
        documentNumber,
        documentType: this.documentType,
        issuedAt: this.updatedAt
      })
    )
  }

  markFailed(reason: string): void {
    this.attempts += 1
    this.status = InvoiceStatus.FAILED
    this.failureReason = new FailureReason(reason)
    this.updatedAt = new Date()

    this.record(
      new InvoiceFailedEvent({
        invoiceId: this.id.value,
        orderId: this.snapshot.orderId,
        reason,
        attempts: this.attempts,
        failedAt: this.updatedAt
      })
    )
  }

  ensureRetryable(): void {
    if (this.status !== InvoiceStatus.FAILED) {
      throw new InvoiceNotRetryable(this.status)
    }
  }

  resetToPending(): void {
    this.status = InvoiceStatus.PENDING
    this.updatedAt = new Date()
  }

  isIssued(): boolean {
    return this.status === InvoiceStatus.ISSUED
  }

  static fromPrimitives(p: InvoicePrimitives): Invoice {
    return new Invoice(
      new InvoiceId(p.id),
      p.snapshot,
      p.documentType,
      p.status,
      p.cufeCude !== null ? new CufeCude(p.cufeCude) : null,
      p.factusDocumentNumber !== null ? new FactusDocumentNumber(p.factusDocumentNumber) : null,
      p.failureReason !== null ? new FailureReason(p.failureReason) : null,
      p.attempts,
      p.createdAt,
      p.updatedAt
    )
  }

  toPrimitives(): InvoicePrimitives {
    return {
      id: this.id.value,
      snapshot: this.snapshot,
      documentType: this.documentType,
      status: this.status,
      cufeCude: this.cufeCude !== null ? this.cufeCude.value : null,
      factusDocumentNumber: this.factusDocumentNumber !== null ? this.factusDocumentNumber.value : null,
      failureReason: this.failureReason !== null ? this.failureReason.value : null,
      attempts: this.attempts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

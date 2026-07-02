import { InvoicePrimitives } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceSnapshot } from '@contexts/billing/invoice/domain/invoice-snapshot'
import { DocumentType } from '@contexts/billing/invoice/domain/document-type'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'

export class InvoiceResponse {
  id: string
  snapshot: InvoiceSnapshot
  documentType: DocumentType
  status: InvoiceStatus
  cufeCude: string | null
  factusDocumentNumber: string | null
  failureReason: string | null
  attempts: number
  createdAt: string
  updatedAt: string

  static fromPrimitives(primitives: InvoicePrimitives): InvoiceResponse {
    const response = new InvoiceResponse()
    response.id = primitives.id
    response.snapshot = primitives.snapshot
    response.documentType = primitives.documentType
    response.status = primitives.status
    response.cufeCude = primitives.cufeCude
    response.factusDocumentNumber = primitives.factusDocumentNumber
    response.failureReason = primitives.failureReason
    response.attempts = primitives.attempts
    response.createdAt = primitives.createdAt.toISOString()
    response.updatedAt = primitives.updatedAt.toISOString()
    return response
  }
}

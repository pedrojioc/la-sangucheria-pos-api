import { faker } from '@faker-js/faker'
import { Invoice, InvoicePrimitives } from '@contexts/billing/invoice/domain/invoice'
import { InvoiceStatus } from '@contexts/billing/invoice/domain/invoice-status'
import { DocumentType } from '@contexts/billing/invoice/domain/document-type'
import { InvoiceSnapshot } from '@contexts/billing/invoice/domain/invoice-snapshot'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class InvoiceSnapshotMother {
  static create(params: Partial<InvoiceSnapshot> = {}): InvoiceSnapshot {
    return {
      orderId: params.orderId ?? UuidMother.random(),
      orderNumber: params.orderNumber ?? faker.number.int({ min: 1, max: 9999 }),
      documentType: params.documentType ?? DocumentType.DOCUMENTO_EQUIVALENTE,
      subtotal: params.subtotal ?? 10000,
      discountTotal: params.discountTotal ?? 0,
      taxBase: params.taxBase ?? 10000,
      taxAmount: params.taxAmount ?? 1900,
      taxConfig: params.taxConfig ?? { name: 'IVA', rate: 19, inclusive: true },
      items: params.items ?? [
        {
          productId: UuidMother.random(),
          productName: faker.commerce.productName(),
          quantity: 1,
          unitPrice: 10000,
          lineTotal: 10000,
          taxAmount: 1900
        }
      ],
      customerDocumentType: params.customerDocumentType ?? null,
      customerDocumentNumber: params.customerDocumentNumber ?? null,
      closedAt: params.closedAt ?? new Date(),
      currency: params.currency ?? 'COP'
    }
  }
}

export class InvoiceMother {
  static primitives(params: Partial<InvoicePrimitives> = {}): InvoicePrimitives {
    const snapshot = params.snapshot ?? InvoiceSnapshotMother.create()
    return {
      id: params.id ?? UuidMother.random(),
      snapshot,
      documentType: params.documentType ?? DocumentType.DOCUMENTO_EQUIVALENTE,
      status: params.status ?? InvoiceStatus.PENDING,
      cufeCude: params.cufeCude ?? null,
      factusDocumentNumber: params.factusDocumentNumber ?? null,
      failureReason: params.failureReason ?? null,
      attempts: params.attempts ?? 0,
      createdAt: params.createdAt ?? new Date(),
      updatedAt: params.updatedAt ?? new Date()
    }
  }

  static pending(params: Partial<InvoicePrimitives> = {}): Invoice {
    const snapshot = params.snapshot ?? InvoiceSnapshotMother.create()
    return Invoice.createPending(params.id ?? UuidMother.random(), snapshot)
  }

  static issued(params: Partial<InvoicePrimitives> = {}): Invoice {
    const invoice = InvoiceMother.pending(params)
    invoice.markIssued(
      params.cufeCude ?? faker.string.alphanumeric(64),
      params.factusDocumentNumber ?? faker.string.alphanumeric(10)
    )
    return invoice
  }

  static failed(params: Partial<InvoicePrimitives> = {}): Invoice {
    const invoice = InvoiceMother.pending(params)
    invoice.markFailed(params.failureReason ?? 'Connection timeout')
    return invoice
  }

  static fromPrimitives(params: Partial<InvoicePrimitives> = {}): Invoice {
    return Invoice.fromPrimitives(InvoiceMother.primitives(params))
  }
}

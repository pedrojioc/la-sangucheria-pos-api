import { DocumentType } from './document-type'

export interface InvoiceSnapshot {
  orderId: string
  orderNumber: number
  documentType: DocumentType
  subtotal: number
  discountTotal: number
  taxBase: number
  taxAmount: number
  taxConfig: { name: string; rate: number; inclusive: boolean }
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    lineTotal: number
    taxAmount: number
  }>
  customerDocumentType: string | null
  customerDocumentNumber: string | null
  closedAt: Date
  currency: string
}

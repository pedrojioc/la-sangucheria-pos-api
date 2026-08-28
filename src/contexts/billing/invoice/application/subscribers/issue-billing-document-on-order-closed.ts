import { Injectable } from '@nestjs/common'
import { Uuid } from '@shared/domain/value-objects/uuid'
import { DomainEventSubscriber, DomainEventClass } from '@shared/domain/events'
import { OrderClosedEvent } from '@contexts/orders/order/domain/events/order-closed.event'
import type { OrderClosedItemPayload } from '@contexts/orders/order/domain/events/order-closed.event'
import { DocumentType } from '@contexts/billing/invoice/domain/document-type'
import { InvoiceSnapshot } from '@contexts/billing/invoice/domain/invoice-snapshot'
import { IssueInvoice } from '../issue-invoice/issue-invoice'

@Injectable()
export class IssueBillingDocumentOnOrderClosed implements DomainEventSubscriber<OrderClosedEvent> {
  constructor(private readonly issueInvoice: IssueInvoice) {}

  subscribedTo(): DomainEventClass[] {
    return [OrderClosedEvent]
  }

  async on(event: OrderClosedEvent): Promise<void> {
    const { payload } = event

    const documentType = payload.customerDocumentType
      ? DocumentType.FACTURA_NOMBRADA
      : DocumentType.DOCUMENTO_EQUIVALENTE

    const snapshot: InvoiceSnapshot = {
      orderId: payload.orderId,
      orderNumber: parseInt(payload.orderNumber, 10),
      documentType,
      subtotal: payload.subtotal,
      discountTotal: payload.discountTotal,
      taxBase: payload.taxBase,
      taxAmount: payload.taxAmount,
      taxConfig: {
        name: payload.taxConfig.type,
        rate: payload.taxConfig.rate,
        inclusive: payload.taxConfig.inclusive
      },
      items: payload.items.map((item: OrderClosedItemPayload) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount: item.taxAmount,
        lineTotal: item.lineTotal
      })),
      customerDocumentType: payload.customerDocumentType,
      customerDocumentNumber: payload.customerDocumentNumber,
      closedAt: payload.closedAt,
      currency: payload.currency
    }

    await this.issueInvoice.run(Uuid.random().value, snapshot)
  }
}

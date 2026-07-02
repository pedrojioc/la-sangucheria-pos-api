import { faker } from '@faker-js/faker'
import { OrderClosedEvent, OrderClosedPayload } from '@contexts/orders/order/domain/events/order-closed.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class OrderClosedEventMother {
  static create(overrides: Partial<OrderClosedPayload> = {}): OrderClosedEvent {
    return new OrderClosedEvent({
      orderId: overrides.orderId ?? UuidMother.random(),
      orderNumber: overrides.orderNumber ?? String(faker.number.int({ min: 1000, max: 9999 })),
      tableId: overrides.tableId ?? UuidMother.random(),
      customerId: overrides.customerId ?? null,
      total: overrides.total ?? 50000,
      tip: overrides.tip ?? 0,
      currency: overrides.currency ?? 'COP',
      payments: overrides.payments ?? [],
      splits: overrides.splits ?? [],
      closedBy: overrides.closedBy ?? UuidMother.random(),
      closedAt: overrides.closedAt ?? new Date(),
      subtotal: overrides.subtotal ?? 42017,
      discountTotal: overrides.discountTotal ?? 0,
      taxBase: overrides.taxBase ?? 42017,
      taxAmount: overrides.taxAmount ?? 7983,
      taxConfig: overrides.taxConfig ?? { rate: 0.19, type: 'IVA', inclusive: true },
      items: overrides.items ?? [
        {
          productId: UuidMother.random(),
          productName: faker.commerce.productName(),
          quantity: 1,
          unitPrice: 50000,
          lineTotal: 50000,
          taxAmount: 7983,
        },
      ],
      customerDocumentType: overrides.customerDocumentType !== undefined ? overrides.customerDocumentType : null,
      customerDocumentNumber: overrides.customerDocumentNumber !== undefined ? overrides.customerDocumentNumber : null,
    })
  }

  static withCustomer(documentNumber: string, documentType: string = 'NIT'): OrderClosedEvent {
    return OrderClosedEventMother.create({
      customerDocumentType: documentType,
      customerDocumentNumber: documentNumber,
    })
  }

  static anonymous(): OrderClosedEvent {
    return OrderClosedEventMother.create({
      customerDocumentType: null,
      customerDocumentNumber: null,
    })
  }
}

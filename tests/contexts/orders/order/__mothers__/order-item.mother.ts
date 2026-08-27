import { faker } from '@faker-js/faker'
import { OrderItemPrimitives } from '@contexts/orders/order/domain/order-item'
import { OrderItemStatus } from '@contexts/orders/order/domain/order-item-status'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class OrderItemMother {
  static create(params: Partial<OrderItemPrimitives> = {}): OrderItemPrimitives {
    return {
      id: params.id ?? UuidMother.random(),
      productId: params.productId ?? UuidMother.random(),
      productName: params.productName ?? faker.commerce.productName(),
      unitPrice:
        params.unitPrice ?? faker.number.float({ min: 5000, max: 50000, fractionDigits: 2 }),
      currency: params.currency ?? 'COP',
      quantity: params.quantity ?? faker.number.int({ min: 1, max: 5 }),
      modifiers: params.modifiers ?? [],
      notes: params.notes ?? null,
      discount: params.discount ?? null,
      status: params.status ?? OrderItemStatus.PENDING,
      sentAt: params.sentAt ?? null,
      readyAt: params.readyAt ?? null,
      deliveredAt: params.deliveredAt ?? null,
      deliveredBy: params.deliveredBy ?? null,
      cancelledAt: params.cancelledAt ?? null,
      cancelledBy: params.cancelledBy ?? null,
      cancellationReason: params.cancellationReason ?? null,
      stationId: params.stationId ?? null
    }
  }

  static pending(overrides: Partial<OrderItemPrimitives> = {}): OrderItemPrimitives {
    return this.create({ ...overrides, status: OrderItemStatus.PENDING })
  }

  static sent(overrides: Partial<OrderItemPrimitives> = {}): OrderItemPrimitives {
    return this.create({
      ...overrides,
      status: OrderItemStatus.SENT,
      sentAt: new Date()
    })
  }

  static ready(overrides: Partial<OrderItemPrimitives> = {}): OrderItemPrimitives {
    return this.create({
      ...overrides,
      status: OrderItemStatus.READY,
      sentAt: new Date(),
      readyAt: new Date()
    })
  }

  static delivered(overrides: Partial<OrderItemPrimitives> = {}): OrderItemPrimitives {
    return this.create({
      ...overrides,
      status: OrderItemStatus.DELIVERED,
      sentAt: new Date(),
      readyAt: new Date(),
      deliveredAt: new Date(),
      deliveredBy: overrides.deliveredBy ?? UuidMother.random()
    })
  }

  static cancelled(overrides: Partial<OrderItemPrimitives> = {}): OrderItemPrimitives {
    return this.create({
      ...overrides,
      status: OrderItemStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy: overrides.cancelledBy ?? UuidMother.random(),
      cancellationReason: overrides.cancellationReason ?? 'Out of stock'
    })
  }
}

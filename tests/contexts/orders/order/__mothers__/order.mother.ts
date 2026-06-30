import { faker } from '@faker-js/faker'
import { Order, OrderPrimitives } from '@contexts/orders/order/domain/order'
import { OrderType } from '@contexts/orders/order/domain/order-type'
import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { TaxType } from '@contexts/orders/order/domain/tax-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderItemMother } from './order-item.mother'
import { OrderItemPrimitives } from '@contexts/orders/order/domain/order-item'

export class OrderMother {
  static create(params: Partial<OrderPrimitives> = {}): Order {
    const primitives: OrderPrimitives = {
      id: params.id ?? UuidMother.random(),
      orderNumber: params.orderNumber ?? `ORD-${faker.number.int({ min: 1, max: 9999 })}`,
      type: params.type ?? OrderType.DINE_IN,
      status: params.status ?? OrderStatus.OPEN,
      tableId: 'tableId' in params ? (params.tableId ?? null) : UuidMother.random(),
      customerId: params.customerId ?? null,
      addressId: params.addressId ?? null,
      deliveryFee: params.deliveryFee ?? null,
      currency: params.currency ?? 'COP',
      items: params.items ?? [],
      kitchenTickets: params.kitchenTickets ?? [],
      payments: params.payments ?? null,
      splits: params.splits ?? null,
      taxConfig: params.taxConfig ?? { rate: 0.08, type: TaxType.INC, inclusive: true },
      orderDiscount: params.orderDiscount ?? null,
      subtotal: params.subtotal ?? 0,
      discountTotal: params.discountTotal ?? 0,
      taxBase: params.taxBase ?? 0,
      taxAmount: params.taxAmount ?? 0,
      total: params.total ?? 0,
      tip: params.tip ?? null,
      notes: params.notes ?? null,
      openedBy: params.openedBy ?? UuidMother.random(),
      openedAt: params.openedAt ?? new Date(),
      closedBy: params.closedBy ?? null,
      closedAt: params.closedAt ?? null,
      cancelledBy: params.cancelledBy ?? null,
      cancelledAt: params.cancelledAt ?? null,
      cancelledReason: params.cancelledReason ?? null
    }
    return Order.fromPrimitives(primitives)
  }

  static inProgress(items?: OrderItemPrimitives[]): Order {
    const orderItems = items ?? [OrderItemMother.sent(), OrderItemMother.ready()]
    return this.create({
      status: OrderStatus.IN_PROGRESS,
      items: orderItems
    })
  }

  static withAllItemsReady(): Order {
    return this.create({
      status: OrderStatus.IN_PROGRESS,
      items: [OrderItemMother.ready(), OrderItemMother.ready()]
    })
  }

  static readyToClose(): Order {
    return this.create({
      status: OrderStatus.READY,
      items: [OrderItemMother.delivered(), OrderItemMother.delivered()]
    })
  }

  static withOneItemReadyAndOneDelivered(): Order {
    return this.create({
      status: OrderStatus.IN_PROGRESS,
      items: [OrderItemMother.ready(), OrderItemMother.delivered()]
    })
  }

  static withMixedActiveAndCancelled(): Order {
    return this.create({
      status: OrderStatus.IN_PROGRESS,
      items: [OrderItemMother.ready(), OrderItemMother.cancelled()]
    })
  }
}

import { Order } from '../../domain/order'
import { OrderPrimitives } from '../../domain/order'
import { TaxConfigPrimitives } from '../../domain/tax-config'
import { DiscountPrimitives } from '../../domain/discount'

export class OrderResponse {
  constructor(
    public readonly id: string,
    public readonly orderNumber: string,
    public readonly type: string,
    public readonly status: string,
    public readonly tableId: string | null,
    public readonly customerId: string | null,
    public readonly addressId: string | null,
    public readonly deliveryFee: number | null,
    public readonly currency: string,
    public readonly items: OrderPrimitives['items'],
    public readonly kitchenTickets: OrderPrimitives['kitchenTickets'],
    public readonly payments: OrderPrimitives['payments'],
    public readonly splits: OrderPrimitives['splits'],
    public readonly taxConfig: TaxConfigPrimitives,
    public readonly orderDiscount: DiscountPrimitives | null,
    public readonly subtotal: number,
    public readonly discountTotal: number,
    public readonly taxBase: number,
    public readonly taxAmount: number,
    public readonly total: number,
    public readonly tip: number | null,
    public readonly notes: string | null,
    public readonly openedBy: string,
    public readonly openedAt: Date,
    public readonly closedBy: string | null,
    public readonly closedAt: Date | null,
    public readonly cancelledBy: string | null,
    public readonly cancelledAt: Date | null,
    public readonly cancelledReason: string | null
  ) {}

  static fromAggregate(order: Order): OrderResponse {
    const p = order.toPrimitives()
    return new OrderResponse(
      p.id,
      p.orderNumber,
      p.type,
      p.status,
      p.tableId,
      p.customerId,
      p.addressId,
      p.deliveryFee,
      p.currency,
      p.items,
      p.kitchenTickets,
      p.payments,
      p.splits,
      p.taxConfig,
      p.orderDiscount,
      p.subtotal,
      p.discountTotal,
      p.taxBase,
      p.taxAmount,
      p.total,
      p.tip,
      p.notes,
      p.openedBy,
      p.openedAt,
      p.closedBy,
      p.closedAt,
      p.cancelledBy,
      p.cancelledAt,
      p.cancelledReason
    )
  }
}

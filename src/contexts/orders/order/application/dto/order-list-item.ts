import { OrderStatus } from '../../domain/order-status'
import { OrderType } from '../../domain/order-type'

export class OrderListItem {
  constructor(
    public readonly id: string,
    public readonly orderNumber: string,
    public readonly type: OrderType,
    public readonly status: OrderStatus,
    public readonly tableId: string | null,
    public readonly customerId: string | null,
    public readonly subtotal: number,
    public readonly total: number,
    public readonly currency: string,
    public readonly openedBy: string,
    public readonly openedAt: Date,
    public readonly closedAt: Date | null
  ) {}
}

import { OrderPayment, OrderPaymentPrimitives } from './order-payment'

export interface OrderSplitPrimitives {
  label: string
  itemIds: string[]
  payment: OrderPaymentPrimitives
}

export class OrderSplit {
  private constructor(
    public readonly label: string,
    public readonly itemIds: string[],
    public readonly payment: OrderPayment
  ) {}

  static create(label: string, itemIds: string[], payment: OrderPayment): OrderSplit {
    return new OrderSplit(label, itemIds, payment)
  }

  toPrimitives(): OrderSplitPrimitives {
    return {
      label: this.label,
      itemIds: this.itemIds,
      payment: this.payment.toPrimitives()
    }
  }

  static fromPrimitives(primitives: OrderSplitPrimitives): OrderSplit {
    return new OrderSplit(
      primitives.label,
      primitives.itemIds,
      OrderPayment.fromPrimitives(primitives.payment)
    )
  }
}

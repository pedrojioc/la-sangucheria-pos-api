export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'VOUCHER' | 'OTHER'

export interface OrderPaymentPrimitives {
  method: PaymentMethod
  amount: number
  currency: string
}

export class OrderPayment {
  private constructor(
    public readonly method: PaymentMethod,
    public readonly amount: number,
    public readonly currency: string
  ) {}

  static create(method: PaymentMethod, amount: number, currency: string): OrderPayment {
    if (amount <= 0) {
      throw new Error('Payment amount must be positive')
    }
    return new OrderPayment(method, amount, currency)
  }

  toPrimitives(): OrderPaymentPrimitives {
    return { method: this.method, amount: this.amount, currency: this.currency }
  }

  static fromPrimitives(primitives: OrderPaymentPrimitives): OrderPayment {
    return new OrderPayment(primitives.method, primitives.amount, primitives.currency)
  }
}

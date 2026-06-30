import { Money } from '@shared/domain/value-objects/money'

export interface OrderItemModifierPrimitives {
  optionGroupId: string
  optionGroupName: string
  optionItemId: string
  optionItemName: string
  priceAdjustment: number
  currency: string
}

export class OrderItemModifier {
  constructor(
    public readonly optionGroupId: string,
    public readonly optionGroupName: string,
    public readonly optionItemId: string,
    public readonly optionItemName: string,
    public readonly priceAdjustment: Money
  ) {}

  toPrimitives(): OrderItemModifierPrimitives {
    return {
      optionGroupId: this.optionGroupId,
      optionGroupName: this.optionGroupName,
      optionItemId: this.optionItemId,
      optionItemName: this.optionItemName,
      priceAdjustment: this.priceAdjustment.amount,
      currency: this.priceAdjustment.currency
    }
  }

  static fromPrimitives(primitives: OrderItemModifierPrimitives): OrderItemModifier {
    return new OrderItemModifier(
      primitives.optionGroupId,
      primitives.optionGroupName,
      primitives.optionItemId,
      primitives.optionItemName,
      new Money(primitives.priceAdjustment, primitives.currency)
    )
  }
}

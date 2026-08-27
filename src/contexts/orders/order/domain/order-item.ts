import { Entity } from '@shared/domain/entity'
import { Uuid } from '@shared/domain/value-objects/uuid'
import { Money } from '@shared/domain/value-objects/money'
import { OrderItemStatus } from './order-item-status'
import { OrderItemModifier, OrderItemModifierPrimitives } from './order-item-modifier'
import { Discount, DiscountPrimitives } from './discount'

export interface OrderItemPrimitives {
  id: string
  productId: string
  productName: string
  unitPrice: number
  currency: string
  quantity: number
  modifiers: OrderItemModifierPrimitives[]
  notes: string | null
  discount: DiscountPrimitives | null
  status: OrderItemStatus
  sentAt: Date | null
  readyAt: Date | null
  deliveredAt: Date | null
  deliveredBy: string | null
  cancelledAt: Date | null
  cancelledBy: string | null
  cancellationReason: string | null
  stationId: string | null
}

export class OrderItem extends Entity {
  private constructor(
    public readonly id: Uuid,
    public readonly productId: string,
    public readonly productName: string,
    private unitPrice: Money,
    private quantity: number,
    private modifiers: OrderItemModifier[],
    private notes: string | null,
    private discount: Discount | null,
    private status: OrderItemStatus,
    private sentAt: Date | null,
    private readyAt: Date | null,
    private deliveredAt: Date | null,
    private deliveredBy: string | null,
    private cancelledAt: Date | null,
    private cancelledBy: string | null,
    private cancellationReason: string | null,
    private stationId: string | null
  ) {
    super()
  }

  static create(
    id: string,
    productId: string,
    productName: string,
    unitPrice: number,
    currency: string,
    quantity: number,
    modifiers: OrderItemModifierPrimitives[],
    notes: string | null
  ): OrderItem {
    return new OrderItem(
      new Uuid(id),
      productId,
      productName,
      new Money(unitPrice, currency),
      quantity,
      modifiers.map(OrderItemModifier.fromPrimitives),
      notes,
      null,
      OrderItemStatus.PENDING,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null
    )
  }

  updateQuantityAndNotes(quantity: number, notes: string | null): void {
    this.quantity = quantity
    this.notes = notes
  }

  markSent(stationId: string | null): void {
    this.status = OrderItemStatus.SENT
    this.sentAt = new Date()
    this.stationId = stationId
  }

  markReady(): void {
    this.status = OrderItemStatus.READY
    this.readyAt = new Date()
  }

  markDelivered(deliveredBy: string): void {
    this.status = OrderItemStatus.DELIVERED
    this.deliveredAt = new Date()
    this.deliveredBy = deliveredBy
  }

  cancel(reason: string, cancelledBy: string): void {
    this.status = OrderItemStatus.CANCELLED
    this.cancelledAt = new Date()
    this.cancelledBy = cancelledBy
    this.cancellationReason = reason
  }

  getStatus(): OrderItemStatus {
    return this.status
  }

  applyDiscount(discount: Discount): void {
    this.discount = discount
  }

  removeDiscount(): void {
    this.discount = null
  }

  get lineTotal(): Money {
    const modifierTotal = this.modifiers.reduce((sum, m) => sum + m.priceAdjustment.amount, 0)
    return new Money(
      (this.unitPrice.amount + modifierTotal) * this.quantity,
      this.unitPrice.currency
    )
  }

  get discountAmount(): Money {
    if (!this.discount) {
      return new Money(0, this.unitPrice.currency)
    }
    return this.discount.amountOn(this.lineTotal)
  }

  get netTotal(): Money {
    return this.lineTotal.subtract(this.discountAmount)
  }

  isActive(): boolean {
    return this.status !== OrderItemStatus.CANCELLED
  }

  toPrimitives(): OrderItemPrimitives {
    return {
      id: this.id.value,
      productId: this.productId,
      productName: this.productName,
      unitPrice: this.unitPrice.amount,
      currency: this.unitPrice.currency,
      quantity: this.quantity,
      modifiers: this.modifiers.map(m => m.toPrimitives()),
      notes: this.notes,
      discount: this.discount?.toPrimitives() ?? null,
      status: this.status,
      sentAt: this.sentAt,
      readyAt: this.readyAt,
      deliveredAt: this.deliveredAt,
      deliveredBy: this.deliveredBy,
      cancelledAt: this.cancelledAt,
      cancelledBy: this.cancelledBy,
      cancellationReason: this.cancellationReason,
      stationId: this.stationId
    }
  }

  static fromPrimitives(primitives: OrderItemPrimitives): OrderItem {
    return new OrderItem(
      new Uuid(primitives.id),
      primitives.productId,
      primitives.productName,
      new Money(primitives.unitPrice, primitives.currency),
      primitives.quantity,
      primitives.modifiers.map(OrderItemModifier.fromPrimitives),
      primitives.notes,
      primitives.discount ? Discount.fromPrimitives(primitives.discount) : null,
      primitives.status,
      primitives.sentAt,
      primitives.readyAt,
      primitives.deliveredAt,
      primitives.deliveredBy,
      primitives.cancelledAt,
      primitives.cancelledBy,
      primitives.cancellationReason,
      primitives.stationId
    )
  }
}

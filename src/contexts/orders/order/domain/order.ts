import { AggregateRoot } from '@shared/domain/aggregate-root'
import { Money } from '@shared/domain/value-objects/money'
import { OrderId } from './order-id'
import { OrderNumber } from './order-number'
import { OrderType } from './order-type'
import { OrderStatus } from './order-status'
import { OrderItemStatus } from './order-item-status'
import { OrderItem, OrderItemPrimitives } from './order-item'
import { OrderItemModifierPrimitives } from './order-item-modifier'
import { KitchenTicket, KitchenTicketPrimitives } from './kitchen-ticket'
import { OrderPayment, OrderPaymentPrimitives } from './order-payment'
import { OrderSplit, OrderSplitPrimitives } from './order-split'
import { Discount, DiscountPrimitives } from './discount'
import { TaxConfig, TaxConfigPrimitives } from './tax-config'
import { OrderOpenedEvent } from './events/order-opened.event'
import { OrderItemsAddedEvent } from './events/order-items-added.event'
import { OrderItemRemovedEvent } from './events/order-item-removed.event'
import { OrderSentToKitchenEvent, SentToKitchenItem } from './events/order-sent-to-kitchen.event'
import { OrderNotExist } from './exceptions/order-not-exist.exception'
import { OrderItemNotExist } from './exceptions/order-item-not-exist.exception'
import { OrderItemNotPending } from './exceptions/order-item-not-pending.exception'
import { OrderCannotBeModified } from './exceptions/order-cannot-be-modified.exception'
import { OrderHasNoPendingItems } from './exceptions/order-has-no-pending-items.exception'
import { OrderItemAlreadyDelivered } from './exceptions/order-item-already-delivered.exception'
import { OrderItemNotSent } from './exceptions/order-item-not-sent.exception'
import { OrderNotReadyToClose } from './exceptions/order-not-ready-to-close.exception'
import { OrderPaymentMismatch } from './exceptions/order-payment-mismatch.exception'
import { OrderItemReadyEvent } from './events/order-item-ready.event'
import { OrderItemDeliveredEvent } from './events/order-item-delivered.event'
import { OrderItemCancelledEvent } from './events/order-item-cancelled.event'
import { OrderCancelledEvent } from './events/order-cancelled.event'
import { OrderClosedEvent } from './events/order-closed.event'
import { OrderReadyEvent } from './events/order-ready.event'
import { OrderItemDiscountAppliedEvent } from './events/order-item-discount-applied.event'
import { OrderItemDiscountRemovedEvent } from './events/order-item-discount-removed.event'
import { OrderDiscountAppliedEvent } from './events/order-discount-applied.event'
import { OrderDiscountRemovedEvent } from './events/order-discount-removed.event'

export interface AddItemInput {
  id: string
  productId: string
  productName: string
  unitPrice: number
  currency: string
  quantity: number
  modifiers: OrderItemModifierPrimitives[]
  notes: string | null
}

export interface OrderPrimitives {
  id: string
  orderNumber: string
  type: OrderType
  status: OrderStatus
  tableId: string | null
  customerId: string | null
  addressId: string | null
  deliveryFee: number | null
  currency: string
  items: OrderItemPrimitives[]
  kitchenTickets: KitchenTicketPrimitives[]
  payments: OrderPaymentPrimitives[] | null
  splits: OrderSplitPrimitives[] | null
  taxConfig: TaxConfigPrimitives
  orderDiscount: DiscountPrimitives | null
  subtotal: number
  discountTotal: number
  taxBase: number
  taxAmount: number
  total: number
  tip: number | null
  notes: string | null
  openedBy: string
  openedAt: Date
  closedBy: string | null
  closedAt: Date | null
  cancelledBy: string | null
  cancelledAt: Date | null
  cancelledReason: string | null
}

export class Order extends AggregateRoot {
  private constructor(
    public readonly id: OrderId,
    private readonly orderNumber: OrderNumber,
    private readonly type: OrderType,
    private status: OrderStatus,
    private readonly tableId: string | null,
    private readonly customerId: string | null,
    private readonly addressId: string | null,
    private readonly deliveryFee: Money | null,
    private readonly currency: string,
    private items: OrderItem[],
    private kitchenTickets: KitchenTicket[],
    private payments: OrderPayment[] | null,
    private splits: OrderSplit[] | null,
    private readonly taxConfig: TaxConfig,
    private orderDiscount: Discount | null,
    private tip: Money | null,
    private notes: string | null,
    private readonly openedBy: string,
    private readonly openedAt: Date,
    private closedBy: string | null,
    private closedAt: Date | null,
    private cancelledBy: string | null,
    private cancelledAt: Date | null,
    private cancelledReason: string | null
  ) {
    super()
  }

  static create(
    id: string,
    orderNumber: string,
    type: OrderType,
    openedBy: string,
    notes: string | null,
    tableId?: string | null,
    customerId?: string | null,
    addressId?: string | null,
    deliveryFee?: number | null,
    currency: string = 'COP',
    taxConfig?: TaxConfig
  ): Order {
    const now = new Date()

    const order = new Order(
      new OrderId(id),
      new OrderNumber(orderNumber),
      type,
      OrderStatus.OPEN,
      tableId ?? null,
      customerId ?? null,
      addressId ?? null,
      deliveryFee != null ? new Money(deliveryFee, currency) : null,
      currency,
      [],
      [],
      null,
      null,
      taxConfig ?? TaxConfig.defaultColombia(),
      null,
      null,
      notes,
      openedBy,
      now,
      null,
      null,
      null,
      null,
      null
    )

    order.record(
      new OrderOpenedEvent({
        orderId: id,
        orderNumber,
        type,
        tableId: tableId ?? null,
        customerId: customerId ?? null,
        openedBy,
        openedAt: now
      })
    )

    return order
  }

  addItems(inputs: AddItemInput[]): void {
    this.ensureCanBeModified()

    const newItems = inputs.map(input =>
      OrderItem.create(
        input.id,
        input.productId,
        input.productName,
        input.unitPrice,
        input.currency ?? this.currency,
        input.quantity,
        input.modifiers,
        input.notes
      )
    )

    this.items.push(...newItems)

    this.record(
      new OrderItemsAddedEvent({
        orderId: this.id.value,
        itemIds: newItems.map(i => i.id.value)
      })
    )
  }

  updateItem(itemId: string, quantity?: number, notes?: string | null): void {
    this.ensureCanBeModified()

    const item = this.findItem(itemId)
    if (item.getStatus() !== OrderItemStatus.PENDING) {
      throw new OrderItemNotPending(itemId)
    }

    item.updateQuantityAndNotes(
      quantity ?? item.toPrimitives().quantity,
      notes !== undefined ? notes : item.toPrimitives().notes
    )
  }

  removeItem(itemId: string): void {
    this.ensureCanBeModified()

    const item = this.findItem(itemId)
    if (item.getStatus() !== OrderItemStatus.PENDING) {
      throw new OrderItemNotPending(itemId)
    }

    this.items = this.items.filter(i => i.id.value !== itemId)

    this.record(
      new OrderItemRemovedEvent({
        orderId: this.id.value,
        itemId
      })
    )
  }

  sendToKitchen(
    ticketId: string,
    itemIds: string[],
    sentBy: string,
    stationAssignments?: Map<string, string | null>,
    tableId?: string | null,
    tableLabel?: string | null
  ): void {
    this.ensureCanBeModified()

    const pendingItems = this.items.filter(
      i => i.getStatus() === OrderItemStatus.PENDING && itemIds.includes(i.id.value)
    )

    if (pendingItems.length === 0) {
      throw new OrderHasNoPendingItems()
    }

    pendingItems.forEach(item => item.markSent())

    const ticketNumber = this.kitchenTickets.length + 1
    const ticket = KitchenTicket.create(
      ticketId,
      ticketNumber,
      sentBy,
      pendingItems.map(i => i.id.value)
    )
    this.kitchenTickets.push(ticket)

    this.status = OrderStatus.IN_PROGRESS

    const enrichedItems: SentToKitchenItem[] = pendingItems.map(item => {
      const primitives = item.toPrimitives()
      return {
        itemId: item.id.value,
        stationId: stationAssignments?.get(primitives.productId) ?? null,
        productName: primitives.productName,
        quantity: primitives.quantity,
        notes: primitives.notes,
        modifiers: primitives.modifiers.map(m => ({
          name: m.optionItemName,
          price: m.priceAdjustment
        }))
      }
    })

    this.record(
      new OrderSentToKitchenEvent({
        orderId: this.id.value,
        orderNumber: this.orderNumber.value,
        ticketId,
        ticketNumber,
        items: enrichedItems,
        sentBy,
        sentAt: ticket.sentAt,
        tableId: tableId ?? null,
        tableLabel: tableLabel ?? null
      })
    )
  }

  markItemReady(itemId: string): void {
    const item = this.findItem(itemId)
    if (item.getStatus() !== OrderItemStatus.SENT) {
      throw new OrderItemNotSent(itemId)
    }

    const readyAt = new Date()
    item.markReady()

    this.record(
      new OrderItemReadyEvent({
        orderId: this.id.value,
        itemId,
        readyAt
      })
    )
  }

  markItemDelivered(itemId: string, deliveredBy: string): void {
    const item = this.findItem(itemId)
    if (item.getStatus() !== OrderItemStatus.READY) {
      throw new OrderItemNotSent(itemId)
    }

    const deliveredAt = new Date()
    item.markDelivered(deliveredBy)

    const autoCompleted = this.areAllActiveItemsDelivered()
    if (autoCompleted) {
      this.status = OrderStatus.READY
    }

    this.record(
      new OrderItemDeliveredEvent({
        orderId: this.id.value,
        itemId,
        deliveredBy,
        deliveredAt,
        orderAutoCompleted: autoCompleted
      })
    )

    if (autoCompleted) {
      this.record(
        new OrderReadyEvent({
          orderId: this.id.value,
          orderNumber: this.orderNumber.value,
          tableId: this.tableId,
          readyAt: new Date()
        })
      )
    }
  }

  cancelItem(itemId: string, reason: string, cancelledBy: string): void {
    this.ensureCanBeModified()

    const item = this.findItem(itemId)
    if (item.getStatus() === OrderItemStatus.DELIVERED) {
      throw new OrderItemAlreadyDelivered(itemId)
    }

    const cancelledAt = new Date()
    item.cancel(reason, cancelledBy)

    this.record(
      new OrderItemCancelledEvent({
        orderId: this.id.value,
        itemId,
        reason,
        cancelledBy,
        cancelledAt
      })
    )
  }

  cancel(reason: string, cancelledBy: string): void {
    if (this.status !== OrderStatus.OPEN && this.status !== OrderStatus.IN_PROGRESS) {
      throw new OrderCannotBeModified(this.status)
    }

    const cancelledAt = new Date()
    this.status = OrderStatus.CANCELLED
    this.cancelledBy = cancelledBy
    this.cancelledAt = cancelledAt
    this.cancelledReason = reason

    this.record(
      new OrderCancelledEvent({
        orderId: this.id.value,
        reason,
        cancelledBy,
        cancelledAt,
        tableId: this.tableId,
        customerId: this.customerId,
        total: this.total.amount,
        currency: this.currency
      })
    )
  }

  close(
    payments: Array<{ method: 'CASH' | 'CARD' | 'TRANSFER'; amount: number }>,
    closedBy: string,
    tip?: number | null,
    splits?: Array<{
      label: string
      itemIds: string[]
      payment: { method: 'CASH' | 'CARD' | 'TRANSFER'; amount: number }
    }> | null,
    customerDocumentType: string | null = null,
    customerDocumentNumber: string | null = null
  ): void {
    if (this.status !== OrderStatus.IN_PROGRESS && this.status !== OrderStatus.READY) {
      throw new OrderNotReadyToClose(this.status)
    }

    const orderTotal = this.total.amount
    const tipAmount = tip ?? 0
    const paymentsTotal = payments.reduce((sum, p) => sum + p.amount, 0)

    if (Math.abs(paymentsTotal - (orderTotal + tipAmount)) > 0.01) {
      throw new OrderPaymentMismatch(orderTotal + tipAmount, paymentsTotal, this.currency)
    }

    const now = new Date()
    this.payments = payments.map(p => OrderPayment.create(p.method, p.amount, this.currency))
    this.tip = tipAmount > 0 ? new Money(tipAmount, this.currency) : null
    this.splits = splits
      ? splits.map(s =>
          OrderSplit.create(
            s.label,
            s.itemIds,
            OrderPayment.create(s.payment.method, s.payment.amount, this.currency)
          )
        )
      : null
    this.status = OrderStatus.CLOSED
    this.closedBy = closedBy
    this.closedAt = now

    const taxConfigPrimitives = this.taxConfig.toPrimitives()
    const activeItems = this.items.filter(i => i.isActive())
    const orderTaxAmount = this.taxAmount.amount

    // Distribute tax proportionally per item: item.lineTotal / orderTotal * orderTaxAmount.
    // If orderTotal is 0, each item taxAmount is 0.
    const itemPayloads = activeItems.map(item => {
      const p = item.toPrimitives()
      const proportionalTax =
        orderTotal > 0
          ? Math.round((p.unitPrice * p.quantity / orderTotal) * orderTaxAmount * 100) / 100
          : 0
      return {
        productId: p.productId,
        productName: p.productName,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        lineTotal: item.lineTotal.amount,
        taxAmount: proportionalTax
      }
    })

    this.record(
      new OrderClosedEvent({
        orderId: this.id.value,
        orderNumber: this.orderNumber.value,
        tableId: this.tableId,
        customerId: this.customerId,
        total: orderTotal,
        tip: tipAmount > 0 ? tipAmount : null,
        currency: this.currency,
        payments: this.payments.map(p => p.toPrimitives()),
        splits: this.splits ? this.splits.map(s => s.toPrimitives()) : null,
        closedBy,
        closedAt: now,
        subtotal: this.subtotal.amount,
        discountTotal: this.discountTotal.amount,
        taxBase: this.taxBase.amount,
        taxAmount: orderTaxAmount,
        taxConfig: {
          rate: taxConfigPrimitives.rate,
          type: taxConfigPrimitives.type,
          inclusive: taxConfigPrimitives.inclusive
        },
        items: itemPayloads,
        customerDocumentType,
        customerDocumentNumber
      })
    )
  }

  private areAllActiveItemsDelivered(): boolean {
    const activeItems = this.items.filter(i => i.isActive())
    return (
      activeItems.length > 0 && activeItems.every(i => i.getStatus() === OrderItemStatus.DELIVERED)
    )
  }

  private ensureCanBeModified(): void {
    if (this.status !== OrderStatus.OPEN && this.status !== OrderStatus.IN_PROGRESS) {
      throw new OrderCannotBeModified(this.status)
    }
  }

  private findItem(itemId: string): OrderItem {
    const item = this.items.find(i => i.id.value === itemId)
    if (!item) {
      throw new OrderItemNotExist(itemId)
    }
    return item
  }

  applyItemDiscount(itemId: string, discount: Discount): void {
    this.ensureCanBeModified()
    const item = this.findItem(itemId)
    item.applyDiscount(discount)
    this.record(new OrderItemDiscountAppliedEvent({ orderId: this.id.value, itemId, discount: discount.toPrimitives() }))
  }

  removeItemDiscount(itemId: string): void {
    this.ensureCanBeModified()
    const item = this.findItem(itemId)
    item.removeDiscount()
    this.record(new OrderItemDiscountRemovedEvent({ orderId: this.id.value, itemId }))
  }

  applyOrderDiscount(discount: Discount): void {
    this.ensureCanBeModified()
    this.orderDiscount = discount
    this.record(new OrderDiscountAppliedEvent({ orderId: this.id.value, discount: discount.toPrimitives() }))
  }

  removeOrderDiscount(): void {
    this.ensureCanBeModified()
    this.orderDiscount = null
    this.record(new OrderDiscountRemovedEvent({ orderId: this.id.value }))
  }

  /** Gross subtotal: sum of active item line totals (before any discounts) */
  get subtotal(): Money {
    const activeItems = this.items.filter(i => i.isActive())
    const amount = activeItems.reduce((sum, i) => sum + i.lineTotal.amount, 0)
    return new Money(amount, this.currency)
  }

  /** Sum of all item-level discount amounts */
  get itemDiscountTotal(): Money {
    const activeItems = this.items.filter(i => i.isActive())
    const amount = activeItems.reduce((sum, i) => sum + i.discountAmount.amount, 0)
    return new Money(amount, this.currency)
  }

  /** Subtotal after item-level discounts */
  private get subtotalAfterItemDiscounts(): Money {
    const activeItems = this.items.filter(i => i.isActive())
    const amount = activeItems.reduce((sum, i) => sum + i.netTotal.amount, 0)
    return new Money(amount, this.currency)
  }

  /** Order-level discount amount (applied to subtotal after item discounts) */
  get orderDiscountAmount(): Money {
    if (!this.orderDiscount) {
      return new Money(0, this.currency)
    }
    return this.orderDiscount.amountOn(this.subtotalAfterItemDiscounts)
  }

  /** Total discount: item discounts + order discount */
  get discountTotal(): Money {
    return this.itemDiscountTotal.add(this.orderDiscountAmount)
  }

  /** Net total after all discounts (before delivery fee and tip) */
  private get netTotalAfterDiscounts(): Money {
    return this.subtotalAfterItemDiscounts.subtract(this.orderDiscountAmount)
  }

  /** Tax base extracted from discounted total */
  get taxBase(): Money {
    const { taxBase } = this.taxConfig.extractTax(this.netTotalAfterDiscounts)
    return taxBase
  }

  /** Tax amount extracted from discounted total */
  get taxAmount(): Money {
    const { taxAmount } = this.taxConfig.extractTax(this.netTotalAfterDiscounts)
    return taxAmount
  }

  /**
   * Final total: netTotalAfterDiscounts + deliveryFee + tip
   * Tax is inclusive (already inside netTotalAfterDiscounts), so not added.
   * Delivery fee and tip are NOT subject to tax.
   */
  get total(): Money {
    let result = this.netTotalAfterDiscounts
    if (this.deliveryFee) {
      result = result.add(this.deliveryFee)
    }
    if (this.tip) {
      result = result.add(this.tip)
    }
    return result
  }

  getStatus(): OrderStatus {
    return this.status
  }

  toPrimitives(): OrderPrimitives {
    return {
      id: this.id.value,
      orderNumber: this.orderNumber.value,
      type: this.type,
      status: this.status,
      tableId: this.tableId,
      customerId: this.customerId,
      addressId: this.addressId,
      deliveryFee: this.deliveryFee?.amount ?? null,
      currency: this.currency,
      items: this.items.map(i => i.toPrimitives()),
      kitchenTickets: this.kitchenTickets.map(t => t.toPrimitives()),
      payments: this.payments ? this.payments.map(p => p.toPrimitives()) : null,
      splits: this.splits ? this.splits.map(s => s.toPrimitives()) : null,
      taxConfig: this.taxConfig.toPrimitives(),
      orderDiscount: this.orderDiscount?.toPrimitives() ?? null,
      subtotal: this.subtotal.amount,
      discountTotal: this.discountTotal.amount,
      taxBase: this.taxBase.amount,
      taxAmount: this.taxAmount.amount,
      total: this.total.amount,
      tip: this.tip?.amount ?? null,
      notes: this.notes,
      openedBy: this.openedBy,
      openedAt: this.openedAt,
      closedBy: this.closedBy,
      closedAt: this.closedAt,
      cancelledBy: this.cancelledBy,
      cancelledAt: this.cancelledAt,
      cancelledReason: this.cancelledReason
    }
  }

  static fromPrimitives(primitives: OrderPrimitives): Order {
    return new Order(
      new OrderId(primitives.id),
      new OrderNumber(primitives.orderNumber),
      primitives.type,
      primitives.status,
      primitives.tableId,
      primitives.customerId,
      primitives.addressId,
      primitives.deliveryFee != null
        ? new Money(primitives.deliveryFee, primitives.currency)
        : null,
      primitives.currency,
      primitives.items.map(OrderItem.fromPrimitives),
      primitives.kitchenTickets.map(KitchenTicket.fromPrimitives),
      primitives.payments ? primitives.payments.map(OrderPayment.fromPrimitives) : null,
      primitives.splits ? primitives.splits.map(OrderSplit.fromPrimitives) : null,
      TaxConfig.fromPrimitives(primitives.taxConfig),
      primitives.orderDiscount ? Discount.fromPrimitives(primitives.orderDiscount) : null,
      primitives.tip != null ? new Money(primitives.tip, primitives.currency) : null,
      primitives.notes,
      primitives.openedBy,
      primitives.openedAt,
      primitives.closedBy,
      primitives.closedAt,
      primitives.cancelledBy,
      primitives.cancelledAt,
      primitives.cancelledReason
    )
  }
}

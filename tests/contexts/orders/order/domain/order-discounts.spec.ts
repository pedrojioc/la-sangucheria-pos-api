import { OrderStatus } from '@contexts/orders/order/domain/order-status'
import { Discount } from '@contexts/orders/order/domain/discount'
import { DiscountType } from '@contexts/orders/order/domain/discount-type'
import { DiscountMethod } from '@contexts/orders/order/domain/discount-method'
import { TaxType } from '@contexts/orders/order/domain/tax-type'
import { OrderCannotBeModified } from '@contexts/orders/order/domain/exceptions/order-cannot-be-modified.exception'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { OrderMother } from '../__mothers__/order.mother'
import { OrderItemMother } from '../__mothers__/order-item.mother'

describe('Order - Item Discount', () => {
  describe('applyItemDiscount', () => {
    it('should apply a percentage discount to an item', () => {
      const itemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.OPEN,
        items: [OrderItemMother.pending({ id: itemId, unitPrice: 25000, quantity: 1 })]
      })

      const discount = Discount.create(
        DiscountType.EMPLOYEE,
        DiscountMethod.PERCENTAGE,
        10,
        'user-1'
      )
      order.applyItemDiscount(itemId, discount)

      const primitives = order.toPrimitives()
      const item = primitives.items.find(i => i.id === itemId)!
      expect(item.discount).not.toBeNull()
      expect(item.discount!.type).toBe(DiscountType.EMPLOYEE)
      expect(item.discount!.value).toBe(10)
    })

    it('should apply a flat discount to an item', () => {
      const itemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.OPEN,
        items: [OrderItemMother.pending({ id: itemId, unitPrice: 25000, quantity: 1 })]
      })

      const discount = Discount.create(DiscountType.PROMO, DiscountMethod.FLAT, 5000, 'user-1')
      order.applyItemDiscount(itemId, discount)

      const primitives = order.toPrimitives()
      expect(primitives.discountTotal).toBe(5000)
    })

    it('should reject discount on a closed order', () => {
      const itemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.CLOSED,
        items: [OrderItemMother.delivered({ id: itemId, unitPrice: 25000, quantity: 1 })]
      })

      const discount = Discount.create(
        DiscountType.EMPLOYEE,
        DiscountMethod.PERCENTAGE,
        10,
        'user-1'
      )

      expect(() => order.applyItemDiscount(itemId, discount)).toThrow(OrderCannotBeModified)
    })
  })

  describe('removeItemDiscount', () => {
    it('should remove an existing item discount', () => {
      const itemId = UuidMother.random()
      const order = OrderMother.create({
        status: OrderStatus.OPEN,
        items: [OrderItemMother.pending({ id: itemId, unitPrice: 25000, quantity: 1 })]
      })

      const discount = Discount.create(DiscountType.EMPLOYEE, DiscountMethod.FLAT, 5000, 'user-1')
      order.applyItemDiscount(itemId, discount)
      order.removeItemDiscount(itemId)

      const primitives = order.toPrimitives()
      const item = primitives.items.find(i => i.id === itemId)!
      expect(item.discount).toBeNull()
      expect(primitives.discountTotal).toBe(0)
    })
  })
})

describe('Order - Order Discount', () => {
  describe('applyOrderDiscount', () => {
    it('should apply an order-level percentage discount', () => {
      const order = OrderMother.create({
        status: OrderStatus.OPEN,
        items: [
          OrderItemMother.pending({ unitPrice: 20000, quantity: 1 }),
          OrderItemMother.pending({ unitPrice: 30000, quantity: 1 })
        ]
      })

      const discount = Discount.create(
        DiscountType.HAPPY_HOUR,
        DiscountMethod.PERCENTAGE,
        10,
        'user-1'
      )
      order.applyOrderDiscount(discount)

      const primitives = order.toPrimitives()
      expect(primitives.orderDiscount).not.toBeNull()
      expect(primitives.orderDiscount!.type).toBe(DiscountType.HAPPY_HOUR)
      // 10% of 50000 = 5000
      expect(primitives.discountTotal).toBe(5000)
    })

    it('should replace an existing order-level discount', () => {
      const order = OrderMother.create({
        status: OrderStatus.OPEN,
        items: [OrderItemMother.pending({ unitPrice: 20000, quantity: 1 })]
      })

      const first = Discount.create(DiscountType.PROMO, DiscountMethod.PERCENTAGE, 10, 'user-1')
      order.applyOrderDiscount(first)

      const second = Discount.create(DiscountType.MANAGER, DiscountMethod.FLAT, 5000, 'user-2')
      order.applyOrderDiscount(second)

      const primitives = order.toPrimitives()
      expect(primitives.orderDiscount!.type).toBe(DiscountType.MANAGER)
      expect(primitives.discountTotal).toBe(5000)
    })

    it('should reject discount on a closed order', () => {
      const order = OrderMother.create({
        status: OrderStatus.CLOSED,
        items: [OrderItemMother.delivered({ unitPrice: 20000, quantity: 1 })]
      })

      const discount = Discount.create(DiscountType.PROMO, DiscountMethod.PERCENTAGE, 10, 'user-1')

      expect(() => order.applyOrderDiscount(discount)).toThrow(OrderCannotBeModified)
    })
  })

  describe('removeOrderDiscount', () => {
    it('should remove the order-level discount', () => {
      const order = OrderMother.create({
        status: OrderStatus.OPEN,
        items: [OrderItemMother.pending({ unitPrice: 20000, quantity: 1 })]
      })

      const discount = Discount.create(DiscountType.PROMO, DiscountMethod.FLAT, 5000, 'user-1')
      order.applyOrderDiscount(discount)
      order.removeOrderDiscount()

      const primitives = order.toPrimitives()
      expect(primitives.orderDiscount).toBeNull()
      expect(primitives.discountTotal).toBe(0)
    })
  })
})

describe('Order - Full Calculation Chain', () => {
  it('should compute: gross subtotal -> item discounts -> order discount -> tax extraction', () => {
    const itemId1 = UuidMother.random()
    const itemId2 = UuidMother.random()
    const order = OrderMother.create({
      status: OrderStatus.OPEN,
      taxConfig: { rate: 0.08, type: TaxType.INC, inclusive: true },
      items: [
        OrderItemMother.pending({ id: itemId1, unitPrice: 25000, quantity: 2 }), // lineTotal = 50000
        OrderItemMother.pending({ id: itemId2, unitPrice: 10000, quantity: 1 }) // lineTotal = 10000
      ]
    })

    // Gross subtotal = 60000
    expect(order.toPrimitives().subtotal).toBe(60000)

    // Apply 10% item discount to item 1: 50000 * 10% = 5000
    const itemDiscount = Discount.create(
      DiscountType.EMPLOYEE,
      DiscountMethod.PERCENTAGE,
      10,
      'user-1'
    )
    order.applyItemDiscount(itemId1, itemDiscount)

    // After item discounts: 55000
    // Apply 10% order discount: 55000 * 10% = 5500
    const orderDiscount = Discount.create(
      DiscountType.HAPPY_HOUR,
      DiscountMethod.PERCENTAGE,
      10,
      'user-1'
    )
    order.applyOrderDiscount(orderDiscount)

    const primitives = order.toPrimitives()

    // Net after all discounts = 55000 - 5500 = 49500
    // discountTotal = 5000 (item) + 5500 (order) = 10500
    expect(primitives.discountTotal).toBe(10500)

    // Tax extraction: taxBase = 49500 / 1.08 = 45833.33, taxAmount = 49500 - 45833.33 = 3666.67
    expect(primitives.taxBase).toBeCloseTo(45833.33, 2)
    expect(primitives.taxAmount).toBeCloseTo(3666.67, 2)

    // Total = netAfterDiscounts (49500) — no delivery fee, no tip
    expect(primitives.total).toBe(49500)
  })

  it('should include delivery fee in total but NOT subject it to tax', () => {
    const order = OrderMother.create({
      status: OrderStatus.OPEN,
      deliveryFee: 5000,
      taxConfig: { rate: 0.08, type: TaxType.INC, inclusive: true },
      items: [
        OrderItemMother.pending({ unitPrice: 25000, quantity: 1 }) // lineTotal = 25000
      ]
    })

    const primitives = order.toPrimitives()

    // Tax extracted from 25000 only (not from delivery fee)
    expect(primitives.taxBase).toBeCloseTo(23148.15, 2)
    expect(primitives.taxAmount).toBeCloseTo(1851.85, 2)

    // Total = 25000 + 5000 (delivery fee) = 30000
    expect(primitives.total).toBe(30000)
  })

  it('should handle order with no discounts and default tax config', () => {
    const order = OrderMother.create({
      status: OrderStatus.OPEN,
      items: [OrderItemMother.pending({ unitPrice: 10000, quantity: 1 })]
    })

    const primitives = order.toPrimitives()

    expect(primitives.subtotal).toBe(10000)
    expect(primitives.discountTotal).toBe(0)
    // Default INC 8%: taxBase = 10000 / 1.08 = 9259.26
    expect(primitives.taxBase).toBeCloseTo(9259.26, 2)
    expect(primitives.taxAmount).toBeCloseTo(740.74, 2)
    expect(primitives.total).toBe(10000)
  })

  it('should handle discount capped at item line total', () => {
    const itemId = UuidMother.random()
    const order = OrderMother.create({
      status: OrderStatus.OPEN,
      items: [OrderItemMother.pending({ id: itemId, unitPrice: 10000, quantity: 1 })]
    })

    // Flat discount of 15000 on a 10000 item -> capped at 10000
    const discount = Discount.create(DiscountType.MANAGER, DiscountMethod.FLAT, 15000, 'user-1')
    order.applyItemDiscount(itemId, discount)

    const primitives = order.toPrimitives()
    expect(primitives.discountTotal).toBe(10000)
    expect(primitives.total).toBe(0)
    expect(primitives.taxBase).toBe(0)
    expect(primitives.taxAmount).toBe(0)
  })
})

describe('Order - close() with discounts', () => {
  it('should close successfully with payment matching discounted total', () => {
    const itemId = UuidMother.random()
    const order = OrderMother.create({
      status: OrderStatus.IN_PROGRESS,
      items: [OrderItemMother.delivered({ id: itemId, unitPrice: 25000, quantity: 1 })]
    })

    // Apply 10% discount -> effective discount = 2500, total = 22500
    const discount = Discount.create(DiscountType.EMPLOYEE, DiscountMethod.PERCENTAGE, 10, 'user-1')
    order.applyItemDiscount(itemId, discount)

    const total = order.toPrimitives().total
    expect(total).toBe(22500)

    order.close([{ method: 'CASH', amount: total }], 'cashier-1')

    expect(order.getStatus()).toBe(OrderStatus.CLOSED)
  })

  it('should close with tip added on top of discounted total', () => {
    const order = OrderMother.create({
      status: OrderStatus.READY,
      items: [OrderItemMother.delivered({ unitPrice: 20000, quantity: 1 })]
    })

    const total = order.toPrimitives().total // 20000
    const tipAmount = 3000

    order.close([{ method: 'CASH', amount: total + tipAmount }], 'cashier-1', tipAmount)

    const primitives = order.toPrimitives()
    expect(primitives.status).toBe(OrderStatus.CLOSED)
    expect(primitives.tip).toBe(3000)
    // After close, total includes tip: 20000 + 3000 = 23000
    expect(primitives.total).toBe(23000)
  })
})

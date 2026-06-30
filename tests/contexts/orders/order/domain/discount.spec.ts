import { Money } from '@shared/domain/value-objects/money'
import { Discount } from '@contexts/orders/order/domain/discount'
import { DiscountType } from '@contexts/orders/order/domain/discount-type'
import { DiscountMethod } from '@contexts/orders/order/domain/discount-method'

describe('Discount', () => {
  describe('percentage discount', () => {
    it('should calculate the correct amount on a base', () => {
      const discount = Discount.create(
        DiscountType.EMPLOYEE,
        DiscountMethod.PERCENTAGE,
        10,
        'user-1'
      )
      const base = new Money(25000, 'COP')

      const amount = discount.amountOn(base)

      expect(amount.amount).toBe(2500)
      expect(amount.currency).toBe('COP')
    })

    it('should cap at 100% (full base amount)', () => {
      const discount = Discount.create(
        DiscountType.MANAGER,
        DiscountMethod.PERCENTAGE,
        100,
        'user-1'
      )
      const base = new Money(25000, 'COP')

      const amount = discount.amountOn(base)

      expect(amount.amount).toBe(25000)
    })

    it('should reject percentage above 100', () => {
      expect(() =>
        Discount.create(DiscountType.PROMO, DiscountMethod.PERCENTAGE, 101, 'user-1')
      ).toThrow('Percentage discount cannot exceed 100')
    })
  })

  describe('flat discount', () => {
    it('should return the flat value when below base', () => {
      const discount = Discount.create(DiscountType.PROMO, DiscountMethod.FLAT, 5000, 'user-1')
      const base = new Money(25000, 'COP')

      const amount = discount.amountOn(base)

      expect(amount.amount).toBe(5000)
    })

    it('should cap at base when flat value exceeds base', () => {
      const discount = Discount.create(DiscountType.PROMO, DiscountMethod.FLAT, 15000, 'user-1')
      const base = new Money(10000, 'COP')

      const amount = discount.amountOn(base)

      expect(amount.amount).toBe(10000)
    })
  })

  describe('validation', () => {
    it('should reject zero value', () => {
      expect(() =>
        Discount.create(DiscountType.EMPLOYEE, DiscountMethod.FLAT, 0, 'user-1')
      ).toThrow('Discount value must be positive')
    })

    it('should reject negative value', () => {
      expect(() =>
        Discount.create(DiscountType.EMPLOYEE, DiscountMethod.FLAT, -100, 'user-1')
      ).toThrow('Discount value must be positive')
    })
  })

  describe('serialization', () => {
    it('should round-trip through toPrimitives/fromPrimitives', () => {
      const discount = Discount.create(
        DiscountType.LOYALTY,
        DiscountMethod.PERCENTAGE,
        15,
        'user-1',
        'Birthday'
      )

      const primitives = discount.toPrimitives()
      const restored = Discount.fromPrimitives(primitives)

      expect(restored.type).toBe(DiscountType.LOYALTY)
      expect(restored.method).toBe(DiscountMethod.PERCENTAGE)
      expect(restored.value).toBe(15)
      expect(restored.reason).toBe('Birthday')
      expect(restored.appliedBy).toBe('user-1')
    })
  })

  describe('amountOn with zero base', () => {
    it('should return zero for percentage on zero base', () => {
      const discount = Discount.create(
        DiscountType.EMPLOYEE,
        DiscountMethod.PERCENTAGE,
        50,
        'user-1'
      )
      const base = new Money(0, 'COP')

      const amount = discount.amountOn(base)

      expect(amount.amount).toBe(0)
    })

    it('should return zero for flat on zero base', () => {
      const discount = Discount.create(DiscountType.EMPLOYEE, DiscountMethod.FLAT, 5000, 'user-1')
      const base = new Money(0, 'COP')

      const amount = discount.amountOn(base)

      expect(amount.amount).toBe(0)
    })
  })
})

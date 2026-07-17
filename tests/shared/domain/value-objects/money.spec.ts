import { Money } from '@shared/domain/value-objects/money'
import { MONEY_CURRENCIES } from '@shared/domain/value-objects/currency'

describe('Money', () => {
  describe('valid currency', () => {
    it('should construct successfully with COP', () => {
      const money = new Money(100, 'COP')
      expect(money.getCurrency()).toBe('COP')
    })

    it('should construct successfully with USD', () => {
      const money = new Money(100, 'USD')
      expect(money.getCurrency()).toBe('USD')
    })

    it('should construct successfully with MXN', () => {
      const money = new Money(100, 'MXN')
      expect(money.getCurrency()).toBe('MXN')
    })

    it('should default to COP when no currency is passed', () => {
      const money = new Money(100)
      expect(money.getCurrency()).toBe('COP')
    })
  })

  describe('invalid currency', () => {
    it('should throw for a well-formed but out-of-catalog code (EUR)', () => {
      expect(() => new Money(100, 'EUR')).toThrow(Error)
    })

    it('should throw for a well-formed but out-of-catalog code (XXX)', () => {
      expect(() => new Money(100, 'XXX')).toThrow(Error)
    })

    it('should throw for a well-formed but out-of-catalog code (ARS)', () => {
      expect(() => new Money(100, 'ARS')).toThrow(Error)
    })

    it('should throw for a malformed lowercase value (cop)', () => {
      expect(() => new Money(100, 'cop')).toThrow(Error)
    })

    it('should throw for a malformed non-alpha value (123)', () => {
      expect(() => new Money(100, '123')).toThrow(Error)
    })

    it('should throw for a malformed short value (abc-ish wrong length)', () => {
      expect(() => new Money(100, 'ab')).toThrow(Error)
    })

    it('should throw for an empty string', () => {
      expect(() => new Money(100, '')).toThrow(Error)
    })
  })

  describe('catalog drift guard', () => {
    it('should keep MONEY_CURRENCIES exactly in sync with COP, USD, MXN', () => {
      expect(MONEY_CURRENCIES).toEqual(['COP', 'USD', 'MXN'])
    })
  })

  describe('add', () => {
    it('should add two Money instances with the same currency', () => {
      const a = new Money(100, 'COP')
      const b = new Money(50, 'COP')
      const result = a.add(b)
      expect(result.getAmount()).toBe(150)
      expect(result.getCurrency()).toBe('COP')
    })

    it('should throw when adding Money instances with different currencies', () => {
      const a = new Money(100, 'COP')
      const b = new Money(50, 'USD')
      expect(() => a.add(b)).toThrow('Cannot add money with different currencies')
    })
  })

  describe('subtract', () => {
    it('should subtract two Money instances with the same currency', () => {
      const a = new Money(100, 'COP')
      const b = new Money(30, 'COP')
      const result = a.subtract(b)
      expect(result.getAmount()).toBe(70)
      expect(result.getCurrency()).toBe('COP')
    })

    it('should throw when subtracting Money instances with different currencies', () => {
      const a = new Money(100, 'COP')
      const b = new Money(30, 'USD')
      expect(() => a.subtract(b)).toThrow('Cannot subtract money with different currencies')
    })

    it('should throw when the subtraction result is negative', () => {
      const a = new Money(10, 'COP')
      const b = new Money(30, 'COP')
      expect(() => a.subtract(b)).toThrow('Cannot have negative money amount')
    })
  })

  describe('multiply', () => {
    it('should multiply the amount by a positive multiplier', () => {
      const a = new Money(10, 'COP')
      const result = a.multiply(3)
      expect(result.getAmount()).toBe(30)
      expect(result.getCurrency()).toBe('COP')
    })

    it('should throw when the multiplier is negative', () => {
      const a = new Money(10, 'COP')
      expect(() => a.multiply(-2)).toThrow('Cannot multiply money by negative number')
    })
  })

  describe('divide', () => {
    it('should divide the amount by a positive divisor', () => {
      const a = new Money(30, 'COP')
      const result = a.divide(3)
      expect(result.getAmount()).toBe(10)
      expect(result.getCurrency()).toBe('COP')
    })

    it('should throw when the divisor is zero', () => {
      const a = new Money(30, 'COP')
      expect(() => a.divide(0)).toThrow('Cannot divide money by zero')
    })

    it('should throw when the divisor is negative', () => {
      const a = new Money(30, 'COP')
      expect(() => a.divide(-3)).toThrow('Cannot divide money by negative number')
    })
  })
})

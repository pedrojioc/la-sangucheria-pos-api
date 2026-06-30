import { Quantity } from '@/shared/domain/value-objects/quantity'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('Quantity', () => {
  const unitId = UuidMother.random()

  describe('constructor', () => {
    it('should create a quantity with positive value', () => {
      const q = new Quantity(10, unitId)
      expect(q.value).toBe(10)
      expect(q.unitId).toBe(unitId)
    })

    it('should allow zero', () => {
      const q = new Quantity(0, unitId)
      expect(q.value).toBe(0)
    })

    it('should accept fractional values', () => {
      const q = new Quantity(2.5, unitId)
      expect(q.value).toBe(2.5)
    })

    it('should throw for negative value', () => {
      expect(() => new Quantity(-1, unitId)).toThrow()
    })
  })

  describe('add', () => {
    it('should add two quantities with same unit', () => {
      const result = new Quantity(10, unitId).add(new Quantity(5, unitId))
      expect(result.value).toBe(15)
      expect(result.unitId).toBe(unitId)
    })

    it('should throw when units differ', () => {
      const other = UuidMother.random()
      expect(() => new Quantity(10, unitId).add(new Quantity(5, other))).toThrow()
    })
  })

  describe('subtract', () => {
    it('should subtract two quantities with same unit', () => {
      const result = new Quantity(10, unitId).subtract(new Quantity(3, unitId))
      expect(result.value).toBe(7)
    })

    it('should allow subtracting to zero', () => {
      const result = new Quantity(10, unitId).subtract(new Quantity(10, unitId))
      expect(result.value).toBe(0)
    })

    it('should throw when result would be negative', () => {
      expect(() => new Quantity(5, unitId).subtract(new Quantity(10, unitId))).toThrow()
    })

    it('should throw when units differ', () => {
      const other = UuidMother.random()
      expect(() => new Quantity(10, unitId).subtract(new Quantity(3, other))).toThrow()
    })
  })

  describe('multiply', () => {
    it('should multiply by a positive scalar', () => {
      expect(new Quantity(10, unitId).multiply(3).value).toBe(30)
    })

    it('should multiply by a fraction', () => {
      expect(new Quantity(10, unitId).multiply(2.5).value).toBe(25)
    })

    it('should multiply by zero', () => {
      expect(new Quantity(10, unitId).multiply(0).value).toBe(0)
    })

    it('should throw for negative multiplier', () => {
      expect(() => new Quantity(10, unitId).multiply(-2)).toThrow()
    })
  })

  describe('comparisons', () => {
    it('isGreaterThan returns true when greater', () => {
      expect(new Quantity(10, unitId).isGreaterThan(new Quantity(5, unitId))).toBe(true)
    })

    it('isGreaterThan returns false when equal', () => {
      expect(new Quantity(10, unitId).isGreaterThan(new Quantity(10, unitId))).toBe(false)
    })

    it('isLessOrEqual returns true when less', () => {
      expect(new Quantity(5, unitId).isLessOrEqual(new Quantity(10, unitId))).toBe(true)
    })

    it('isLessOrEqual returns true when equal', () => {
      expect(new Quantity(10, unitId).isLessOrEqual(new Quantity(10, unitId))).toBe(true)
    })

    it('equals returns true for same value and unit', () => {
      expect(new Quantity(10, unitId).equals(new Quantity(10, unitId))).toBe(true)
    })

    it('equals returns false for different values', () => {
      expect(new Quantity(10, unitId).equals(new Quantity(5, unitId))).toBe(false)
    })

    it('equals returns false for different units', () => {
      expect(new Quantity(10, unitId).equals(new Quantity(10, UuidMother.random()))).toBe(false)
    })
  })

  describe('fromPrimitives / toPrimitives', () => {
    it('should round-trip correctly', () => {
      const q = new Quantity(42.5, unitId)
      const restored = Quantity.fromPrimitives(q.toPrimitives())
      expect(restored.value).toBe(42.5)
      expect(restored.unitId).toBe(unitId)
    })
  })
})

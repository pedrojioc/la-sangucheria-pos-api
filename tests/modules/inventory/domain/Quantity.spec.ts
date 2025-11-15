import { Quantity } from '@/shared/domain/value-objects/quantity'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('Quantity', () => {
  const unitId = UuidMother.random()

  describe('create', () => {
    it('should create a quantity with positive value', () => {
      const quantity = new Quantity(10, unitId)

      expect(quantity.value).toBe(10)
      expect(quantity.unitId).toBe(unitId)
    })

    it('should throw error for negative value', () => {
      expect(() => new Quantity(-5, unitId)).toThrow()
    })

    it('should allow zero value', () => {
      const quantity = new Quantity(0, unitId)

      expect(quantity.value).toBe(0)
    })

    it('should accept fractional values', () => {
      const quantity = new Quantity(2.5, unitId)

      expect(quantity.value).toBe(2.5)
    })
  })

  describe('add', () => {
    it('should add two quantities with same unit', () => {
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(5, unitId)

      const result = q1.add(q2)

      expect(result.value).toBe(15)
      expect(result.unitId).toBe(unitId)
    })

    it('should throw error when adding quantities with different units', () => {
      const otherUnitId = new UnitId(UuidMother.random())
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(5, otherUnitId)

      expect(() => q1.add(q2)).toThrow()
    })
  })

  describe('subtract', () => {
    it('should subtract two quantities with same unit', () => {
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(3, unitId)

      const result = q1.subtract(q2)

      expect(result.value).toBe(7)
    })

    it('should throw error when result would be negative', () => {
      const q1 = new Quantity(5, unitId)
      const q2 = new Quantity(10, unitId)

      expect(() => q1.subtract(q2)).toThrow()
    })

    it('should allow subtracting to zero', () => {
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(10, unitId)

      const result = q1.subtract(q2)

      expect(result.value).toBe(0)
    })

    it('should throw error when subtracting quantities with different units', () => {
      const otherUnitId = new UnitId(UuidMother.random())
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(5, otherUnitId)

      expect(() => q1.subtract(q2)).toThrow()
    })
  })

  describe('multiply', () => {
    it('should multiply quantity by scalar', () => {
      const quantity = new Quantity(10, unitId)

      const result = quantity.multiply(3)

      expect(result.value).toBe(30)
      expect(result.unitId).toBe(unitId)
    })

    it('should multiply by fractional values', () => {
      const quantity = new Quantity(10, unitId)

      const result = quantity.multiply(2.5)

      expect(result.value).toBe(25)
    })

    it('should throw error for negative multiplier', () => {
      const quantity = new Quantity(10, unitId)

      expect(() => quantity.multiply(-2)).toThrow()
    })

    it('should allow multiplying by zero', () => {
      const quantity = new Quantity(10, unitId)

      const result = quantity.multiply(0)

      expect(result.value).toBe(0)
    })
  })

  describe('isGreaterThan', () => {
    it('should return true when greater', () => {
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(5, unitId)

      expect(q1.isGreaterThan(q2)).toBe(true)
    })

    it('should return false when equal', () => {
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(10, unitId)

      expect(q1.isGreaterThan(q2)).toBe(false)
    })

    it('should return false when less', () => {
      const q1 = new Quantity(5, unitId)
      const q2 = new Quantity(10, unitId)

      expect(q1.isGreaterThan(q2)).toBe(false)
    })
  })

  describe('isLessOrEqual', () => {
    it('should return true when less', () => {
      const q1 = new Quantity(5, unitId)
      const q2 = new Quantity(10, unitId)

      expect(q1.isLessOrEqual(q2)).toBe(true)
    })

    it('should return true when equal', () => {
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(10, unitId)

      expect(q1.isLessOrEqual(q2)).toBe(true)
    })

    it('should return false when greater', () => {
      const q1 = new Quantity(15, unitId)
      const q2 = new Quantity(10, unitId)

      expect(q1.isLessOrEqual(q2)).toBe(false)
    })
  })

  describe('equals', () => {
    it('should return true for quantities with same value and unit', () => {
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(10, unitId)

      expect(q1.equals(q2)).toBe(true)
    })

    it('should return false for different values', () => {
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(5, unitId)

      expect(q1.equals(q2)).toBe(false)
    })

    it('should return false for different units', () => {
      const otherUnitId = new UnitId(UuidMother.random())
      const q1 = new Quantity(10, unitId)
      const q2 = new Quantity(10, otherUnitId)

      expect(q1.equals(q2)).toBe(false)
    })
  })

  describe('isZero', () => {
    it('should return true for zero quantity', () => {
      const quantity = new Quantity(0, unitId)

      expect(quantity.isZero()).toBe(true)
    })

    it('should return false for non-zero quantity', () => {
      const quantity = new Quantity(5, unitId)

      expect(quantity.isZero()).toBe(false)
    })
  })
})

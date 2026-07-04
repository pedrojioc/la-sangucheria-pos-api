import { EstablishmentOrderTypes } from '@contexts/establishment/establishment/domain/establishment-order-types'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

describe('EstablishmentOrderTypes', () => {
  describe('valid input', () => {
    it('should accept all three valid order types', () => {
      const vo = new EstablishmentOrderTypes(['DINE_IN', 'DELIVERY', 'TAKEOUT'])
      expect(vo.value).toEqual(['DINE_IN', 'DELIVERY', 'TAKEOUT'])
    })

    it('should accept a single valid type', () => {
      const vo = new EstablishmentOrderTypes(['DINE_IN'])
      expect(vo.value).toEqual(['DINE_IN'])
    })

    it('should accept a subset of valid types', () => {
      const vo = new EstablishmentOrderTypes(['DELIVERY', 'TAKEOUT'])
      expect(vo.value).toEqual(['DELIVERY', 'TAKEOUT'])
    })
  })

  describe('deduplication', () => {
    it('should de-duplicate repeated values preserving first-seen order', () => {
      const vo = new EstablishmentOrderTypes(['DINE_IN', 'DELIVERY', 'DINE_IN'])
      expect(vo.value).toEqual(['DINE_IN', 'DELIVERY'])
    })

    it('should de-duplicate all duplicates down to one element', () => {
      const vo = new EstablishmentOrderTypes(['TAKEOUT', 'TAKEOUT', 'TAKEOUT'])
      expect(vo.value).toEqual(['TAKEOUT'])
    })
  })

  describe('invalid input', () => {
    it('should throw when the array is empty', () => {
      expect(() => new EstablishmentOrderTypes([])).toThrow(InvalidValueObjectException)
    })

    it('should throw when an unknown value is provided', () => {
      expect(() => new EstablishmentOrderTypes(['DINE_IN', 'DRIVE_THRU'])).toThrow(
        InvalidValueObjectException
      )
    })

    it('should throw when all entries are invalid', () => {
      expect(() => new EstablishmentOrderTypes(['UNKNOWN'])).toThrow(InvalidValueObjectException)
    })
  })

  describe('includes()', () => {
    it('should return true for a type that is in the value', () => {
      const vo = new EstablishmentOrderTypes(['DINE_IN', 'DELIVERY'])
      expect(vo.includes('DINE_IN')).toBe(true)
      expect(vo.includes('DELIVERY')).toBe(true)
    })

    it('should return false for a type that is not in the value', () => {
      const vo = new EstablishmentOrderTypes(['DINE_IN', 'DELIVERY'])
      expect(vo.includes('TAKEOUT')).toBe(false)
    })

    it('should return false for an arbitrary string not in the set', () => {
      const vo = new EstablishmentOrderTypes(['DINE_IN'])
      expect(vo.includes('DRIVE_THRU')).toBe(false)
    })
  })
})

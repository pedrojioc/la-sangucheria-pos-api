import { EstablishmentTipSuggestions } from '@contexts/establishment/establishment/domain/establishment-tip-suggestions'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

describe('EstablishmentTipSuggestions', () => {
  describe('valid input', () => {
    it('should accept a valid sorted tuple [0.05, 0.10, 0.15]', () => {
      const vo = new EstablishmentTipSuggestions([0.05, 0.1, 0.15])
      expect(vo.value).toEqual([0.05, 0.1, 0.15])
    })

    it('should accept [0, 0.5, 1] as valid boundary values', () => {
      const vo = new EstablishmentTipSuggestions([0, 0.5, 1])
      expect(vo.value).toEqual([0, 0.5, 1])
    })
  })

  describe('wrong element count', () => {
    it('should throw when the array has only 2 elements', () => {
      expect(() => new EstablishmentTipSuggestions([0.05, 0.1] as never)).toThrow(
        InvalidValueObjectException
      )
    })

    it('should throw when the array has 4 elements', () => {
      expect(() => new EstablishmentTipSuggestions([0.05, 0.1, 0.15, 0.2] as never)).toThrow(
        InvalidValueObjectException
      )
    })
  })

  describe('out-of-range values', () => {
    it('should throw when any value exceeds 1', () => {
      expect(() => new EstablishmentTipSuggestions([0.05, 0.1, 1.5])).toThrow(
        InvalidValueObjectException
      )
    })

    it('should throw when any value is negative', () => {
      expect(() => new EstablishmentTipSuggestions([-0.05, 0.1, 0.15])).toThrow(
        InvalidValueObjectException
      )
    })
  })

  describe('uniqueness', () => {
    it('should throw when two values are identical', () => {
      expect(() => new EstablishmentTipSuggestions([0.1, 0.1, 0.15])).toThrow(
        InvalidValueObjectException
      )
    })

    it('should throw when all three values are the same', () => {
      expect(() => new EstablishmentTipSuggestions([0.1, 0.1, 0.1])).toThrow(
        InvalidValueObjectException
      )
    })
  })

  describe('ascending sort enforcement', () => {
    it('should throw for an unsorted tuple', () => {
      expect(() => new EstablishmentTipSuggestions([0.15, 0.05, 0.1])).toThrow(
        InvalidValueObjectException
      )
    })

    it('should throw for a descending tuple', () => {
      expect(() => new EstablishmentTipSuggestions([0.15, 0.1, 0.05])).toThrow(
        InvalidValueObjectException
      )
    })
  })
})

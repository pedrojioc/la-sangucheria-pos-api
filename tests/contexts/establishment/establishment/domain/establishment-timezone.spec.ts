import {
  EstablishmentTimezone,
  isValidTimezone
} from '@contexts/establishment/establishment/domain/establishment-timezone'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

describe('EstablishmentTimezone', () => {
  describe('valid input', () => {
    it('should accept a canonical IANA timezone (America/Bogota)', () => {
      const vo = new EstablishmentTimezone('America/Bogota')
      expect(vo.value).toBe('America/Bogota')
    })

    it('should accept the canonical form of a deprecated alias (America/New_York)', () => {
      const vo = new EstablishmentTimezone('America/New_York')
      expect(vo.value).toBe('America/New_York')
    })
  })

  describe('invalid input', () => {
    it('should throw for a non-existent but well-shaped zone (Foo/Bar)', () => {
      expect(() => new EstablishmentTimezone('Foo/Bar')).toThrow(InvalidValueObjectException)
    })

    it('should throw for a deprecated IANA alias (US/Eastern) — canonical-only policy', () => {
      expect(() => new EstablishmentTimezone('US/Eastern')).toThrow(InvalidValueObjectException)
    })

    it('should throw for an empty string', () => {
      expect(() => new EstablishmentTimezone('')).toThrow(InvalidValueObjectException)
    })

    it('should throw for a malformed/garbage string (not-a-timezone)', () => {
      expect(() => new EstablishmentTimezone('not-a-timezone')).toThrow(InvalidValueObjectException)
    })

    it('should throw for a malformed/garbage string (xx_YY)', () => {
      expect(() => new EstablishmentTimezone('xx_YY')).toThrow(InvalidValueObjectException)
    })

    it('should throw for a wrong-case value (case-sensitive exact match)', () => {
      expect(() => new EstablishmentTimezone('america/bogota')).toThrow(InvalidValueObjectException)
    })

    it('should include the field name and offending value in the exception message', () => {
      expect(() => new EstablishmentTimezone('Foo/Bar')).toThrow(/timezone/i)
    })
  })

  describe('isValidTimezone predicate', () => {
    it('should return true for a canonical IANA timezone', () => {
      expect(isValidTimezone('America/Bogota')).toBe(true)
    })

    it('should return false for a deprecated alias', () => {
      expect(isValidTimezone('US/Eastern')).toBe(false)
    })
  })
})

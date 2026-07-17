import {
  EstablishmentLocale,
  isCanonicalBcp47Locale
} from '@contexts/establishment/establishment/domain/establishment-locale'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

describe('EstablishmentLocale', () => {
  describe('valid input', () => {
    it('should accept a canonical BCP-47 locale (es-CO)', () => {
      const vo = new EstablishmentLocale('es-CO')
      expect(vo.value).toBe('es-CO')
    })

    it('should accept a canonical BCP-47 locale (en-US)', () => {
      const vo = new EstablishmentLocale('en-US')
      expect(vo.value).toBe('en-US')
    })
  })

  describe('invalid input — structurally invalid (Intl.Locale throws RangeError)', () => {
    it('should throw for a POSIX underscore separator (es_CO)', () => {
      expect(() => new EstablishmentLocale('es_CO')).toThrow(InvalidValueObjectException)
    })

    it('should throw for an empty string', () => {
      expect(() => new EstablishmentLocale('')).toThrow(InvalidValueObjectException)
    })

    it('should throw for malformed subtag garbage', () => {
      expect(() => new EstablishmentLocale('xx-ZZ-invalid-subtag-shape')).toThrow(
        InvalidValueObjectException
      )
    })
  })

  describe('invalid input — structurally valid but non-canonical (round-trip mismatch)', () => {
    // This guard catches what the try/catch alone would NOT catch: Intl.Locale
    // parses 'ES-co' successfully but silently normalizes it to 'es-CO'. The
    // round-trip equality check rejects the non-canonical input instead of
    // rewriting it. Must not be conflated with the throw-path cases above.
    it('should throw for wrong casing (ES-co) even though Intl.Locale parses it', () => {
      expect(() => new EstablishmentLocale('ES-co')).toThrow(InvalidValueObjectException)
    })
  })

  describe('exception message', () => {
    it('should include the field name and offending value', () => {
      expect(() => new EstablishmentLocale('es_CO')).toThrow(/locale/i)
    })
  })

  describe('isCanonicalBcp47Locale predicate', () => {
    it('should return true for a canonical locale', () => {
      expect(isCanonicalBcp47Locale('es-CO')).toBe(true)
    })

    it('should return false for a non-canonical separator', () => {
      expect(isCanonicalBcp47Locale('es_CO')).toBe(false)
    })

    it('should return false for non-canonical casing', () => {
      expect(isCanonicalBcp47Locale('ES-co')).toBe(false)
    })
  })
})

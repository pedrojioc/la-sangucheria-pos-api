import {
  ESTABLISHMENT_CURRENCIES,
  EstablishmentCurrency
} from '@contexts/establishment/establishment/domain/establishment-currency'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

describe('EstablishmentCurrency', () => {
  describe('valid input', () => {
    it('should accept COP', () => {
      const vo = new EstablishmentCurrency('COP')
      expect(vo.value).toBe('COP')
    })

    it('should accept USD', () => {
      const vo = new EstablishmentCurrency('USD')
      expect(vo.value).toBe('USD')
    })

    it('should accept MXN', () => {
      const vo = new EstablishmentCurrency('MXN')
      expect(vo.value).toBe('MXN')
    })
  })

  describe('invalid input', () => {
    it('should throw for a well-formed but out-of-catalog code (XXX)', () => {
      expect(() => new EstablishmentCurrency('XXX')).toThrow(InvalidValueObjectException)
    })

    it('should throw for a well-formed but out-of-catalog code (EUR)', () => {
      expect(() => new EstablishmentCurrency('EUR')).toThrow(InvalidValueObjectException)
    })

    it('should throw for a well-formed but out-of-catalog code (ARS)', () => {
      expect(() => new EstablishmentCurrency('ARS')).toThrow(InvalidValueObjectException)
    })

    it('should throw for a lowercase code', () => {
      expect(() => new EstablishmentCurrency('co')).toThrow(InvalidValueObjectException)
    })

    it('should throw for a wrong-length value', () => {
      expect(() => new EstablishmentCurrency('1234')).toThrow(InvalidValueObjectException)
    })

    it('should throw for an empty string', () => {
      expect(() => new EstablishmentCurrency('')).toThrow(InvalidValueObjectException)
    })
  })

  describe('catalog drift guard', () => {
    it('should keep ESTABLISHMENT_CURRENCIES exactly in sync with COP, USD, MXN', () => {
      expect(ESTABLISHMENT_CURRENCIES).toEqual(['COP', 'USD', 'MXN'])
    })
  })
})

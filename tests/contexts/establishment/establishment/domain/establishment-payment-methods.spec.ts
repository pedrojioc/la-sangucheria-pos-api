import { EstablishmentPaymentMethods } from '@contexts/establishment/establishment/domain/establishment-payment-methods'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

describe('EstablishmentPaymentMethods', () => {
  describe('valid input', () => {
    it('should accept all five valid payment methods', () => {
      const vo = new EstablishmentPaymentMethods(['CASH', 'CARD', 'TRANSFER', 'VOUCHER', 'OTHER'])
      expect(vo.value).toEqual(['CASH', 'CARD', 'TRANSFER', 'VOUCHER', 'OTHER'])
    })

    it('should accept a single valid method', () => {
      const vo = new EstablishmentPaymentMethods(['CASH'])
      expect(vo.value).toEqual(['CASH'])
    })

    it('should accept the default subset [CASH, CARD]', () => {
      const vo = new EstablishmentPaymentMethods(['CASH', 'CARD'])
      expect(vo.value).toEqual(['CASH', 'CARD'])
    })
  })

  describe('deduplication', () => {
    it('should de-duplicate repeated values preserving first-seen order', () => {
      const vo = new EstablishmentPaymentMethods(['CASH', 'CARD', 'CASH'])
      expect(vo.value).toEqual(['CASH', 'CARD'])
    })

    it('should de-duplicate all duplicates down to one element', () => {
      const vo = new EstablishmentPaymentMethods(['TRANSFER', 'TRANSFER'])
      expect(vo.value).toEqual(['TRANSFER'])
    })
  })

  describe('invalid input', () => {
    it('should throw when the array is empty', () => {
      expect(() => new EstablishmentPaymentMethods([])).toThrow(InvalidValueObjectException)
    })

    it('should throw when an unknown payment method is provided', () => {
      expect(() => new EstablishmentPaymentMethods(['CASH', 'CRYPTO'])).toThrow(
        InvalidValueObjectException
      )
    })

    it('should throw when all entries are unknown', () => {
      expect(() => new EstablishmentPaymentMethods(['BITCOIN'])).toThrow(InvalidValueObjectException)
    })
  })
})

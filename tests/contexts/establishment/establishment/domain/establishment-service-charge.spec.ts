import { EstablishmentServiceCharge } from '@contexts/establishment/establishment/domain/establishment-service-charge'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

describe('EstablishmentServiceCharge', () => {
  describe('FIXED type', () => {
    it('should accept a valid fixed amount', () => {
      const vo = new EstablishmentServiceCharge({ type: 'FIXED', value: 5000 })
      expect(vo.value).toEqual({ type: 'FIXED', value: 5000 })
    })

    it('should accept zero as a valid fixed amount', () => {
      const vo = new EstablishmentServiceCharge({ type: 'FIXED', value: 0 })
      expect(vo.value.value).toBe(0)
    })

    it('should accept a large fixed amount', () => {
      expect(() => new EstablishmentServiceCharge({ type: 'FIXED', value: 99999 })).not.toThrow()
    })
  })

  describe('PERCENTAGE type', () => {
    it('should accept a percentage of 0.10 (10%)', () => {
      const vo = new EstablishmentServiceCharge({ type: 'PERCENTAGE', value: 0.10 })
      expect(vo.value).toEqual({ type: 'PERCENTAGE', value: 0.10 })
    })

    it('should accept a percentage of 0 (0%)', () => {
      expect(() => new EstablishmentServiceCharge({ type: 'PERCENTAGE', value: 0 })).not.toThrow()
    })

    it('should accept a percentage of 1 (100%)', () => {
      expect(() => new EstablishmentServiceCharge({ type: 'PERCENTAGE', value: 1 })).not.toThrow()
    })

    it('should throw when percentage exceeds 1', () => {
      expect(() => new EstablishmentServiceCharge({ type: 'PERCENTAGE', value: 1.5 })).toThrow(
        InvalidValueObjectException
      )
    })
  })

  describe('invalid input', () => {
    it('should throw for a negative value', () => {
      expect(() => new EstablishmentServiceCharge({ type: 'FIXED', value: -1 })).toThrow(
        InvalidValueObjectException
      )
    })

    it('should throw for an invalid type', () => {
      expect(
        () => new EstablishmentServiceCharge({ type: 'FLAT' as never, value: 100 })
      ).toThrow(InvalidValueObjectException)
    })
  })
})

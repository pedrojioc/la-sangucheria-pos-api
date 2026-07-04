import { EstablishmentOperatingHours } from '@contexts/establishment/establishment/domain/establishment-operating-hours'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

describe('EstablishmentOperatingHours', () => {
  describe('valid input', () => {
    it('should accept a valid schedule with holidays', () => {
      const vo = new EstablishmentOperatingHours({
        schedule: [
          { day: 'MON', open: '08:00', close: '22:00', closed: false },
          { day: 'SUN', open: '10:00', close: '20:00', closed: false }
        ],
        holidays: ['2024-12-25', '2024-01-01']
      })
      expect(vo.value.schedule).toHaveLength(2)
      expect(vo.value.holidays).toHaveLength(2)
    })

    it('should accept an empty schedule and empty holidays', () => {
      const vo = new EstablishmentOperatingHours({ schedule: [], holidays: [] })
      expect(vo.value).toEqual({ schedule: [], holidays: [] })
    })

    it('should allow overnight shifts where open > close', () => {
      expect(
        () =>
          new EstablishmentOperatingHours({
            schedule: [{ day: 'FRI', open: '22:00', close: '04:00', closed: false }],
            holidays: []
          })
      ).not.toThrow()
    })

    it('should skip time validation when closed is true', () => {
      expect(
        () =>
          new EstablishmentOperatingHours({
            schedule: [{ day: 'SAT', open: '', close: '', closed: true }],
            holidays: []
          })
      ).not.toThrow()
    })
  })

  describe('invalid day values', () => {
    it('should throw for an invalid day name like MONDAY', () => {
      expect(
        () =>
          new EstablishmentOperatingHours({
            schedule: [{ day: 'MONDAY' as never, open: '08:00', close: '18:00', closed: false }],
            holidays: []
          })
      ).toThrow(InvalidValueObjectException)
    })

    it('should throw for a numeric day value', () => {
      expect(
        () =>
          new EstablishmentOperatingHours({
            schedule: [{ day: '1' as never, open: '08:00', close: '18:00', closed: false }],
            holidays: []
          })
      ).toThrow(InvalidValueObjectException)
    })
  })

  describe('invalid time formats', () => {
    it('should throw for an invalid open time format', () => {
      expect(
        () =>
          new EstablishmentOperatingHours({
            schedule: [{ day: 'MON', open: '8:00', close: '18:00', closed: false }],
            holidays: []
          })
      ).toThrow(InvalidValueObjectException)
    })

    it('should throw for an out-of-range hour in close time', () => {
      expect(
        () =>
          new EstablishmentOperatingHours({
            schedule: [{ day: 'TUE', open: '08:00', close: '25:00', closed: false }],
            holidays: []
          })
      ).toThrow(InvalidValueObjectException)
    })
  })

  describe('invalid holiday formats', () => {
    it('should throw for a holiday not matching YYYY-MM-DD', () => {
      expect(
        () =>
          new EstablishmentOperatingHours({
            schedule: [],
            holidays: ['25-12-2024']
          })
      ).toThrow(InvalidValueObjectException)
    })

    it('should throw for a holiday with only month and day', () => {
      expect(
        () =>
          new EstablishmentOperatingHours({
            schedule: [],
            holidays: ['12-25']
          })
      ).toThrow(InvalidValueObjectException)
    })
  })
})

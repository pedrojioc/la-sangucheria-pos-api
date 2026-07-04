import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export const WEEKDAYS: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export interface DaySchedule {
  day: Weekday
  open: string
  close: string
  closed: boolean
}

export interface OperatingHoursShape {
  schedule: DaySchedule[]
  holidays: string[]
}

const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export class EstablishmentOperatingHours {
  readonly value: OperatingHoursShape

  constructor(value: OperatingHoursShape) {
    this.value = value
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: OperatingHoursShape): void {
    for (const entry of value.schedule) {
      if (!(WEEKDAYS as string[]).includes(entry.day)) {
        throw new InvalidValueObjectException(
          `<EstablishmentOperatingHours> invalid day <${entry.day}>. Valid values: ${WEEKDAYS.join(', ')}`
        )
      }

      if (!entry.closed) {
        if (!HH_MM_REGEX.test(entry.open)) {
          throw new InvalidValueObjectException(
            `<EstablishmentOperatingHours> invalid open time <${entry.open}>. Expected HH:mm (24h format)`
          )
        }
        if (!HH_MM_REGEX.test(entry.close)) {
          throw new InvalidValueObjectException(
            `<EstablishmentOperatingHours> invalid close time <${entry.close}>. Expected HH:mm (24h format)`
          )
        }
      }
    }

    for (const holiday of value.holidays) {
      if (!ISO_DATE_REGEX.test(holiday)) {
        throw new InvalidValueObjectException(
          `<EstablishmentOperatingHours> invalid holiday date <${holiday}>. Expected YYYY-MM-DD`
        )
      }
    }
  }
}

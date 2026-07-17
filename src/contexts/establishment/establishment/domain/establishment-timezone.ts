import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

// Computed ONCE at module load. supportedValuesOf('timeZone') returns only
// canonical IANA names (deprecated aliases excluded), so Set.has() rejects
// aliases (Asia/Calcutta) and empty string automatically.
const CANONICAL_TIMEZONES: ReadonlySet<string> = new Set(Intl.supportedValuesOf('timeZone'))

export function isValidTimezone(value: string): boolean {
  return CANONICAL_TIMEZONES.has(value)
}

export class EstablishmentTimezone extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValidTimezone(value)
  }

  private ensureIsValidTimezone(value: string): void {
    if (!isValidTimezone(value)) {
      throw new InvalidValueObjectException(
        `<EstablishmentTimezone> does not allow the value <${value}>. ` +
          `Must be a canonical IANA time zone name.`
      )
    }
  }
}

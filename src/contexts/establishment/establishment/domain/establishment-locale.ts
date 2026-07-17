import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

// STRICT canonical BCP-47:
//  - new Intl.Locale(value) throws RangeError on structurally invalid input
//    (underscore es_CO, empty string, malformed subtags) -> false.
//  - Round-trip equality rejects structurally-valid-but-non-canonical input
//    that Intl.Locale silently normalizes (e.g. casing ES-co -> es-CO).
export function isCanonicalBcp47Locale(value: string): boolean {
  try {
    return new Intl.Locale(value).toString() === value
  } catch {
    return false
  }
}

export class EstablishmentLocale extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValidLocale(value)
  }

  private ensureIsValidLocale(value: string): void {
    if (!isCanonicalBcp47Locale(value)) {
      throw new InvalidValueObjectException(
        `<EstablishmentLocale> does not allow the value <${value}>. ` +
          `Must be a canonical BCP-47 language tag (e.g. es-CO).`
      )
    }
  }
}

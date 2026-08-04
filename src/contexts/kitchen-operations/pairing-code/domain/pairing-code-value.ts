import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

// Crockford-ish alphabet, no 0/O/1/I/L to avoid visual ambiguity when a human
// reads the code off a screen and types it (or reads it aloud) elsewhere.
export const PAIRING_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const PAIRING_CODE_LENGTH = 6

export class PairingCodeValue extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValidFormat(value)
  }

  private ensureIsValidFormat(value: string): void {
    if (value.length !== PAIRING_CODE_LENGTH) {
      throw new InvalidValueObjectException(
        `Invalid PairingCodeValue: <${value}> must be exactly ${PAIRING_CODE_LENGTH} characters`
      )
    }
    for (const char of value) {
      if (!PAIRING_CODE_ALPHABET.includes(char)) {
        throw new InvalidValueObjectException(
          `Invalid PairingCodeValue: <${value}> contains a character outside the allowed alphabet`
        )
      }
    }
  }
}

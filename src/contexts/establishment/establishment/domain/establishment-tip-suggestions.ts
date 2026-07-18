import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class EstablishmentTipSuggestions {
  readonly value: number[]

  constructor(value: number[]) {
    this.ensureIsValid(value)
    this.value = value
  }

  private ensureIsValid(value: number[]): void {
    if (value.length < 1 || value.length > 3) {
      throw new InvalidValueObjectException(
        `<EstablishmentTipSuggestions> must contain between 1 and 3 elements, got <${value.length}>`
      )
    }

    for (const tip of value) {
      if (tip < 0 || tip > 1) {
        throw new InvalidValueObjectException(
          `<EstablishmentTipSuggestions> each value must be between 0 and 1 inclusive, got <${tip}>`
        )
      }
    }

    const unique = new Set(value)
    if (unique.size !== value.length) {
      throw new InvalidValueObjectException(
        '<EstablishmentTipSuggestions> all values must be unique'
      )
    }

    for (let i = 1; i < value.length; i++) {
      if (value[i - 1] >= value[i]) {
        throw new InvalidValueObjectException(
          '<EstablishmentTipSuggestions> values must be in ascending order'
        )
      }
    }
  }
}

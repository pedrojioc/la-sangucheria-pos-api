import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class EstablishmentTipSuggestions {
  readonly value: [number, number, number]

  constructor(value: [number, number, number]) {
    this.value = value
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: [number, number, number]): void {
    if (value.length !== 3) {
      throw new InvalidValueObjectException(
        `<EstablishmentTipSuggestions> must contain exactly 3 elements, got <${value.length}>`
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

    if (value[0] >= value[1] || value[1] >= value[2]) {
      throw new InvalidValueObjectException(
        '<EstablishmentTipSuggestions> values must be in ascending order'
      )
    }
  }
}

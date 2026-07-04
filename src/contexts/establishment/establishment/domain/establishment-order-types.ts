import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export const ORDER_TYPE_VALUES = ['DINE_IN', 'DELIVERY', 'TAKEOUT'] as const

export class EstablishmentOrderTypes {
  readonly value: string[]

  constructor(value: string[]) {
    const deduped = value.filter((v, i, arr) => arr.indexOf(v) === i)
    this.ensureIsValid(deduped)
    this.value = deduped
  }

  private ensureIsValid(value: string[]): void {
    if (value.length === 0) {
      throw new InvalidValueObjectException(
        '<EstablishmentOrderTypes> must contain at least one order type'
      )
    }

    for (const type of value) {
      if (!(ORDER_TYPE_VALUES as readonly string[]).includes(type)) {
        throw new InvalidValueObjectException(
          `<EstablishmentOrderTypes> does not allow the value <${type}>. Valid values: ${ORDER_TYPE_VALUES.join(', ')}`
        )
      }
    }
  }

  includes(type: string): boolean {
    return this.value.includes(type)
  }
}

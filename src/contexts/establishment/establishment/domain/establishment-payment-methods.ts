import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export const PAYMENT_METHOD_VALUES = ['CASH', 'CARD', 'TRANSFER', 'VOUCHER', 'OTHER'] as const

export class EstablishmentPaymentMethods {
  readonly value: string[]

  constructor(value: string[]) {
    const deduped = value.filter((v, i, arr) => arr.indexOf(v) === i)
    this.value = deduped
    this.ensureIsValid(deduped)
  }

  private ensureIsValid(value: string[]): void {
    if (value.length === 0) {
      throw new InvalidValueObjectException(
        '<EstablishmentPaymentMethods> must contain at least one payment method'
      )
    }

    for (const method of value) {
      if (!(PAYMENT_METHOD_VALUES as readonly string[]).includes(method)) {
        throw new InvalidValueObjectException(
          `<EstablishmentPaymentMethods> does not allow the value <${method}>. Valid values: ${PAYMENT_METHOD_VALUES.join(', ')}`
        )
      }
    }
  }
}

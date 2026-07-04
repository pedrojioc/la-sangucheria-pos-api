import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export type ServiceChargeType = 'FIXED' | 'PERCENTAGE'

export interface ServiceChargeShape {
  type: ServiceChargeType
  value: number
}

export class EstablishmentServiceCharge {
  readonly value: ServiceChargeShape

  constructor(value: ServiceChargeShape) {
    this.value = value
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: ServiceChargeShape): void {
    if (value.type !== 'FIXED' && value.type !== 'PERCENTAGE') {
      throw new InvalidValueObjectException(
        `<EstablishmentServiceCharge> invalid type <${value.type}>. Valid values: FIXED, PERCENTAGE`
      )
    }

    if (value.value < 0) {
      throw new InvalidValueObjectException(
        `<EstablishmentServiceCharge> value must be >= 0, got <${value.value}>`
      )
    }

    if (value.type === 'PERCENTAGE' && value.value > 1) {
      throw new InvalidValueObjectException(
        `<EstablishmentServiceCharge> PERCENTAGE value must be between 0 and 1, got <${value.value}>`
      )
    }
  }
}

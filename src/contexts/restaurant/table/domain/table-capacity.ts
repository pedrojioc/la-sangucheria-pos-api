import { NumberValueObject } from '@shared/domain/value-objects/number'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class TableCapacity extends NumberValueObject {
  constructor(value: number) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: number): void {
    if (!Number.isInteger(value) || value < 1) {
      throw new InvalidValueObjectException(
        'La capacidad de la mesa debe ser un entero mayor o igual a 1'
      )
    }
  }
}

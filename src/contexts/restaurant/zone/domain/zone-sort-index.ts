import { NumberValueObject } from '@shared/domain/value-objects/number'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class ZoneSortIndex extends NumberValueObject {
  constructor(value: number) {
    super(value)
    if (!Number.isInteger(value) || value < 0) {
      throw new InvalidValueObjectException('El índice de orden debe ser un entero no negativo')
    }
  }
}

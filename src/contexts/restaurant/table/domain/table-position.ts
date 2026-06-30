import { NumberValueObject } from '@shared/domain/value-objects/number'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class TablePosition extends NumberValueObject {
  constructor(value: number) {
    super(value)
    if (value < 0 || value > 100) {
      throw new InvalidValueObjectException('La posición debe ser un porcentaje entre 0 y 100')
    }
  }
}

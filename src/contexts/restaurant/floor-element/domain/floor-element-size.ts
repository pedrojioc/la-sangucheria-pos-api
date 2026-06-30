import { NumberValueObject } from '@shared/domain/value-objects/number'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class FloorElementSize extends NumberValueObject {
  constructor(value: number) {
    super(value)
    if (value <= 0 || value > 100) {
      throw new InvalidValueObjectException('El tamaño debe ser un porcentaje entre 0.01 y 100')
    }
  }
}

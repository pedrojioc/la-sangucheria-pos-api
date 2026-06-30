import { NumberValueObject } from '@shared/domain/value-objects/number'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class FloorElementRotation extends NumberValueObject {
  constructor(value: number) {
    super(value)
    if (!Number.isInteger(value) || value < 0 || value > 359) {
      throw new InvalidValueObjectException('La rotación debe ser un entero entre 0 y 359')
    }
  }
}

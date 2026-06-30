import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class ZoneColor extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) {
      throw new InvalidValueObjectException('El color de la zona no puede estar vacío')
    }
    if (value.length > 20) {
      throw new InvalidValueObjectException('El color de la zona no puede exceder 20 caracteres')
    }
  }
}

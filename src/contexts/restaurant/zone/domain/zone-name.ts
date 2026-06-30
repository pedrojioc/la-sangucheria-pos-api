import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class ZoneName extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) {
      throw new InvalidValueObjectException('El nombre de la zona no puede estar vacío')
    }
    if (value.length > 50) {
      throw new InvalidValueObjectException('El nombre de la zona no puede exceder 50 caracteres')
    }
  }
}

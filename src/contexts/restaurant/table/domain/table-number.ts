import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class TableNumber extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureMaxLength(value)
  }

  private ensureMaxLength(value: string): void {
    if (value.trim().length === 0) {
      throw new InvalidValueObjectException('El número de mesa no puede estar vacío')
    }
    if (value.length > 20) {
      throw new InvalidValueObjectException('El número de mesa no puede exceder 20 caracteres')
    }
  }
}

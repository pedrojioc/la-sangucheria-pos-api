import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export class CustomerPhone extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) throw new InvalidArgument('Customer phone cannot be empty')
    if (value.length > 30) throw new InvalidArgument('Customer phone cannot exceed 30 characters')
  }
}

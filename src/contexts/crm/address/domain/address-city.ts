import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export class AddressCity extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) throw new InvalidArgument('City cannot be empty')
    if (value.length > 200) throw new InvalidArgument('City cannot exceed 200 characters')
  }
}

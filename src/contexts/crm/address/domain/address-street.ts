import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export class AddressStreet extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) throw new InvalidArgument('Street cannot be empty')
    if (value.length > 500) throw new InvalidArgument('Street cannot exceed 500 characters')
  }
}

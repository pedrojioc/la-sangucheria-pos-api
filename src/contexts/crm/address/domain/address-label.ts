import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export class AddressLabel extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) throw new InvalidArgument('Address label cannot be empty')
    if (value.length > 100) throw new InvalidArgument('Address label cannot exceed 100 characters')
  }
}

import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export class CustomerEmail extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.length > 255) throw new InvalidArgument('Customer email cannot exceed 255 characters')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new InvalidArgument(`Invalid customer email: ${value}`)
    }
  }
}

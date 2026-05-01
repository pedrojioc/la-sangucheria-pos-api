import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export class CustomerDocumentNumber extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) throw new InvalidArgument('Document number cannot be empty')
    if (value.length > 50) throw new InvalidArgument('Document number cannot exceed 50 characters')
  }
}

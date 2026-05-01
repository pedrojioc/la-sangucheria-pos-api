import { StringValueObject } from '@shared/domain/value-objects/string'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export class AddressNeighborhood extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.length > 200) throw new InvalidArgument('Neighborhood cannot exceed 200 characters')
  }
}

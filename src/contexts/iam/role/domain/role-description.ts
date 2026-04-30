import { StringValueObject } from '@/shared/domain/value-objects/string'

export class RoleDescription extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.length > 255) throw new Error('Role description cannot exceed 255 characters')
  }
}

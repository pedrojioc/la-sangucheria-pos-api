import { StringValueObject } from '@/shared/domain/value-objects/string'

export class RoleName extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) throw new Error('Role name cannot be empty')
    if (value.length > 50) throw new Error('Role name cannot exceed 50 characters')
  }
}

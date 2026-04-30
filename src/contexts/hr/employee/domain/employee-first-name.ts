import { StringValueObject } from '@/shared/domain/value-objects/string'

export class EmployeeFirstName extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) throw new Error('Employee first name cannot be empty')
    if (value.length > 100) throw new Error('Employee first name cannot exceed 100 characters')
  }
}

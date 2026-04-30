import { StringValueObject } from '@/shared/domain/value-objects/string'

export class EmployeeLastName extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) throw new Error('Employee last name cannot be empty')
    if (value.length > 100) throw new Error('Employee last name cannot exceed 100 characters')
  }
}

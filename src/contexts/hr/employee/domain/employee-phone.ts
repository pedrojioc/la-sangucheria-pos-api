import { StringValueObject } from '@/shared/domain/value-objects/string'

export class EmployeePhone extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.length > 20) throw new Error('Employee phone cannot exceed 20 characters')
  }
}

import { StringValueObject } from '@/shared/domain/value-objects/string'

export class EmployeeAddress extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.trim().length === 0) throw new Error('Employee address cannot be empty')
    if (value.length > 500) throw new Error('Employee address cannot exceed 500 characters')
  }
}

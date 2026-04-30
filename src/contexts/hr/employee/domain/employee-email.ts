import { StringValueObject } from '@/shared/domain/value-objects/string'

export class EmployeeEmail extends StringValueObject {
  constructor(value: string) {
    super(value)
    if (value.length > 255) throw new Error('Employee email cannot exceed 255 characters')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw new Error(`Invalid employee email: ${value}`)
    }
  }
}

import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidFullName } from './exceptions/invalid-full-name.exception'

export class UserFullName extends StringValueObject {
  private static readonly MAX_LENGTH = 200

  constructor(value: string) {
    super(value.trim())
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    const trimmed = value.trim()

    if (trimmed.length === 0) {
      throw new InvalidFullName('Full name cannot be empty')
    }

    if (trimmed.length > UserFullName.MAX_LENGTH) {
      throw new InvalidFullName(`Full name cannot exceed ${UserFullName.MAX_LENGTH} characters`)
    }
  }
}

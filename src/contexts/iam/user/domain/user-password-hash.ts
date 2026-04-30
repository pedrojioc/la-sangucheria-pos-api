import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidPasswordHash } from './exceptions/invalid-password-hash.exception'

export class UserPasswordHash extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsNotEmpty(value)
  }

  private ensureIsNotEmpty(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new InvalidPasswordHash('Password hash cannot be empty')
    }
  }
}

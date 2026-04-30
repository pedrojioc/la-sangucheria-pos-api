import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidEmail } from './exceptions/invalid-email.exception'

export class UserEmail extends StringValueObject {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  constructor(value: string) {
    super(value.toLowerCase())
    this.ensureIsValidEmail(value)
  }

  private ensureIsValidEmail(value: string): void {
    if (!UserEmail.EMAIL_REGEX.test(value)) {
      throw new InvalidEmail('Invalid email format')
    }
  }
}

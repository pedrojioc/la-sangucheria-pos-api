import { StringValueObject } from '@/shared/domain/value-objects/string'
import { WeakPassword } from './exceptions/weak-password.exception'

export class PlainPassword extends StringValueObject {
  private static readonly MIN_LENGTH = 8
  private static readonly MAX_LENGTH = 128

  constructor(value: string) {
    super(value)
    this.ensureIsStrong(value)
  }

  private ensureIsStrong(value: string): void {
    if (value.length < PlainPassword.MIN_LENGTH) {
      throw new WeakPassword(
        `Password must be at least ${PlainPassword.MIN_LENGTH} characters long`
      )
    }

    if (value.length > PlainPassword.MAX_LENGTH) {
      throw new WeakPassword(`Password cannot exceed ${PlainPassword.MAX_LENGTH} characters`)
    }

    const hasUppercase = /[A-Z]/.test(value)
    const hasLowercase = /[a-z]/.test(value)
    const hasNumber = /\d/.test(value)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      throw new WeakPassword(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      )
    }
  }
}

import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class Email {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  constructor(private readonly value: string) {
    if (!value || !Email.EMAIL_REGEX.test(value)) {
      throw new InvalidValueObjectException('Invalid email format')
    }
  }

  getValue(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

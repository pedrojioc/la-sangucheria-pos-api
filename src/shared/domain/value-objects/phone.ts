import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class Phone {
  private static readonly PHONE_REGEX = /^\+?[1-9]\d{1,14}$/

  constructor(private readonly value: string) {
    const cleanValue = value.replace(/\s|-/g, '')
    if (!cleanValue || !Phone.PHONE_REGEX.test(cleanValue)) {
      throw new InvalidValueObjectException('Invalid phone number format')
    }
    this.value = cleanValue
  }

  getValue(): string {
    return this.value
  }

  equals(other: Phone): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}

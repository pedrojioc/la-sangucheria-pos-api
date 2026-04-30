import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidUsername } from './exceptions/invalid-username.exception'

export class Username extends StringValueObject {
  private static readonly MIN_LENGTH = 3
  private static readonly MAX_LENGTH = 50
  private static readonly REGEX = /^[a-zA-Z0-9_-]+$/

  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value.length < Username.MIN_LENGTH || value.length > Username.MAX_LENGTH) {
      throw new InvalidUsername(
        `Username must be between ${Username.MIN_LENGTH} and ${Username.MAX_LENGTH} characters`
      )
    }

    if (!Username.REGEX.test(value)) {
      throw new InvalidUsername(
        'Username can only contain letters, numbers, underscores, and hyphens'
      )
    }
  }
}

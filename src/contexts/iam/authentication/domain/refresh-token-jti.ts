import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidRefreshTokenJti } from './exceptions/invalid-refresh-token-jti.exception'

export class RefreshTokenJti extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value.length === 0) {
      throw new InvalidRefreshTokenJti('JTI cannot be empty')
    }
  }
}

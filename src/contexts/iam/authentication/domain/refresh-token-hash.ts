import { StringValueObject } from '@/shared/domain/value-objects/string'
import { InvalidRefreshTokenHash } from './exceptions/invalid-refresh-token-hash.exception'

export class RefreshTokenHash extends StringValueObject {
  constructor(value: string) {
    super(value)
    this.ensureIsValid(value)
  }

  private ensureIsValid(value: string): void {
    if (value.length === 0) {
      throw new InvalidRefreshTokenHash('Token hash cannot be empty')
    }
  }
}

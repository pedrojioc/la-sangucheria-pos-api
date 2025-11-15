import { StringValueObject } from '@/shared/domain/value-objects/string'

export class RecipeName extends StringValueObject {
  private static readonly MAX_LENGTH = 100

  constructor(value: string) {
    super(value)
    this.ensureNameIsNotEmpty(value)
    this.ensureNameIsNotTooLong(value)
  }

  private ensureNameIsNotEmpty(value: string): void {
    if (value.trim().length === 0) {
      throw new Error('Recipe name cannot be empty')
    }
  }

  private ensureNameIsNotTooLong(value: string): void {
    if (value.length > RecipeName.MAX_LENGTH) {
      throw new Error(
        `Recipe name cannot exceed ${RecipeName.MAX_LENGTH} characters`
      )
    }
  }
}

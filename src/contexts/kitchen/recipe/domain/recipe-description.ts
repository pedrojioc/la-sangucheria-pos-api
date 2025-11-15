import { StringValueObject } from '@/shared/domain/value-objects/string'

export class RecipeDescription extends StringValueObject {
  private static readonly MAX_LENGTH = 500

  constructor(value: string) {
    super(value)
    this.ensureDescriptionIsNotTooLong(value)
  }

  private ensureDescriptionIsNotTooLong(value: string): void {
    if (value.length > RecipeDescription.MAX_LENGTH) {
      throw new Error(
        `Recipe description cannot exceed ${RecipeDescription.MAX_LENGTH} characters`
      )
    }
  }
}

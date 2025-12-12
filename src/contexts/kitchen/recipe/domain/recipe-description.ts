import { StringValueObject } from '@/shared/domain/value-objects/string'
import { RecipeDescriptionTooLong } from './exceptions/recipe-description-too-long.exception'

export class RecipeDescription extends StringValueObject {
  private static readonly MAX_LENGTH = 500

  constructor(value: string) {
    super(value)
    this.ensureDescriptionIsNotTooLong(value)
  }

  private ensureDescriptionIsNotTooLong(value: string): void {
    if (value.length > RecipeDescription.MAX_LENGTH) {
      throw new RecipeDescriptionTooLong()
    }
  }
}

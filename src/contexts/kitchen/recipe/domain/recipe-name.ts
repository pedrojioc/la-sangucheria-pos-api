import { StringValueObject } from '@/shared/domain/value-objects/string'
import { RecipeNameEmpty } from './exceptions/recipe-name-empty.exception'
import { RecipeNameTooLong } from './exceptions/recipe-name-too-long.exception'

export class RecipeName extends StringValueObject {
  private static readonly MAX_LENGTH = 100

  constructor(value: string) {
    super(value)
    this.ensureNameIsNotEmpty(value)
    this.ensureNameIsNotTooLong(value)
  }

  private ensureNameIsNotEmpty(value: string): void {
    if (value.trim().length === 0) {
      throw new RecipeNameEmpty()
    }
  }

  private ensureNameIsNotTooLong(value: string): void {
    if (value.length > RecipeName.MAX_LENGTH) {
      throw new RecipeNameTooLong()
    }
  }
}

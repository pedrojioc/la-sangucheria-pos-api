export class IngredientCategoryDescriptionTooLong extends Error {
  constructor() {
    super('Ingredient category description too long')
    this.name = 'IngredientCategoryDescriptionTooLong'
  }
}

export abstract class IngredientExistencePort {
  /** Throws when the ingredient does not exist. */
  abstract ensureExists(ingredientId: string): Promise<void>
}

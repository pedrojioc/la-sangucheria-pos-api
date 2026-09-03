export abstract class IngredientDeductionPort {
  abstract deduct(
    ingredientId: string,
    quantity: number,
    unitId: string,
    reason: string,
    referenceId: string
  ): Promise<void>
}

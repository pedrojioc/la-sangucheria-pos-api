export class GetIngredientFifoCostQuery {
  constructor(
    public readonly ingredientId: string,
    public readonly quantity: number,
    public readonly unitId: string
  ) {}
}

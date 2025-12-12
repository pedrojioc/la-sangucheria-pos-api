export class CreateRecipeCommand {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly items: Array<{
      ingredientId: string
      quantity: number
      unitId: string
    }>,
    public readonly recipeYield: {
      value: number
      unitId: string
      description?: string
    },
    public readonly description?: string
  ) {}
}

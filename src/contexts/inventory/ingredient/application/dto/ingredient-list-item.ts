export class IngredientListItem {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly category: {
      id: string
      name: string
      color: string | null
    },
    public readonly unit: {
      id: string
      name: string
      symbol: string
    },
    public readonly minimumStock: number | null,
    public readonly maximumStock: number | null,
    public readonly isPerishable: boolean,
    public readonly shelfLifeDays: number | null,
    public readonly storageLocation: string | null,
    public readonly isActive: boolean
  ) {}
}

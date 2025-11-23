export class IngredientWithDetailsDto {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,

    // Datos de categoría (desnormalizados)
    public readonly category: {
      id: string
      name: string
      color: string | null
    },

    // Datos de unidad (desnormalizados)
    public readonly unit: {
      id: string
      name: string
      symbol: string
    },

    // Datos del ingrediente
    public readonly minimumStock: number | null,
    public readonly maximumStock: number | null,
    public readonly isPerishable: boolean,
    public readonly shelfLifeDays: number | null,
    public readonly storageLocation: string | null,
    public readonly isActive: boolean
  ) {}
}

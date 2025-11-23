import { IngredientWithDetailsDto } from '@/contexts/inventory/ingredient/application/dto/ingredient-with-details.dto'

export class IngredientListItemResponse {
  id: string
  name: string
  description: string | null

  // Datos de categoría (desnormalizados)
  category: {
    id: string
    name: string
    color: string | null
  }

  // Datos de unidad (desnormalizados)
  unit: {
    id: string
    name: string
    symbol: string
  }

  // Datos del ingrediente
  minimumStock: number | null
  maximumStock: number | null
  isPerishable: boolean
  shelfLifeDays: number | null
  storageLocation: string | null
  isActive: boolean

  static fromDto(row: IngredientWithDetailsDto): IngredientListItemResponse {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: {
        id: row.category.id,
        name: row.category.name,
        color: row.category.color
      },
      unit: {
        id: row.unit.id,
        name: row.unit.name,
        symbol: row.unit.symbol
      },
      minimumStock: row.minimumStock ? Number(row.minimumStock) : null,
      maximumStock: row.maximumStock ? Number(row.maximumStock) : null,
      isPerishable: row.isPerishable,
      shelfLifeDays: row.shelfLifeDays,
      storageLocation: row.storageLocation,
      isActive: row.isActive
    }
  }
}

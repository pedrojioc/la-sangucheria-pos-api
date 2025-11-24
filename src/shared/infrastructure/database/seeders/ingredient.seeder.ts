import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { faker } from '@faker-js/faker'
import { Seeder } from './seeder.interface'
import { IngredientEntity } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { IngredientCategoryEntity } from '@contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/ingredient-category.entity'
import { UnitEntity } from '@contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

interface IngredientDefinition {
  name: string
  category: string
  unit: string
  isPerishable: boolean
  shelfLifeDays?: number
  minimumStock?: number
  maximumStock?: number
}

export class IngredientSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const ingredientRepo = dataSource.getRepository(IngredientEntity)

    // Check if ingredients already exist
    const count = await ingredientRepo.count()
    if (count > 0) {
      console.log('⏭️  Ingredients already seeded, skipping...')
      return
    }

    // Get categories and units
    const categoryRepo = dataSource.getRepository(IngredientCategoryEntity)
    const unitRepo = dataSource.getRepository(UnitEntity)

    const categories = await categoryRepo.find()
    const units = await unitRepo.find()

    const categoryMap = new Map(categories.map(c => [c.name, c]))
    const unitMap = new Map(units.map(u => [u.symbol, u]))

    const ingredientDefinitions: IngredientDefinition[] = [
      // Carnes
      { name: 'Pechuga de Pollo', category: 'Carnes', unit: 'kg', isPerishable: true, shelfLifeDays: 3, minimumStock: 10, maximumStock: 50 },
      { name: 'Carne Molida de Res', category: 'Carnes', unit: 'kg', isPerishable: true, shelfLifeDays: 2, minimumStock: 8, maximumStock: 40 },
      { name: 'Tocino', category: 'Carnes', unit: 'kg', isPerishable: true, shelfLifeDays: 7, minimumStock: 5, maximumStock: 20 },
      { name: 'Jamón de Pierna', category: 'Carnes', unit: 'kg', isPerishable: true, shelfLifeDays: 10, minimumStock: 3, maximumStock: 15 },
      { name: 'Chorizo', category: 'Carnes', unit: 'kg', isPerishable: true, shelfLifeDays: 14, minimumStock: 4, maximumStock: 20 },
      { name: 'Salchicha Huachana', category: 'Carnes', unit: 'kg', isPerishable: true, shelfLifeDays: 7, minimumStock: 5, maximumStock: 25 },

      // Verduras
      { name: 'Lechuga Americana', category: 'Verduras', unit: 'un', isPerishable: true, shelfLifeDays: 5, minimumStock: 20, maximumStock: 60 },
      { name: 'Tomate', category: 'Verduras', unit: 'kg', isPerishable: true, shelfLifeDays: 7, minimumStock: 10, maximumStock: 40 },
      { name: 'Cebolla Morada', category: 'Verduras', unit: 'kg', isPerishable: true, shelfLifeDays: 14, minimumStock: 8, maximumStock: 30 },
      { name: 'Palta Hass', category: 'Verduras', unit: 'un', isPerishable: true, shelfLifeDays: 5, minimumStock: 30, maximumStock: 100 },
      { name: 'Zanahoria', category: 'Verduras', unit: 'kg', isPerishable: true, shelfLifeDays: 14, minimumStock: 5, maximumStock: 20 },
      { name: 'Pepino', category: 'Verduras', unit: 'kg', isPerishable: true, shelfLifeDays: 7, minimumStock: 5, maximumStock: 20 },
      { name: 'Pimiento', category: 'Verduras', unit: 'kg', isPerishable: true, shelfLifeDays: 10, minimumStock: 3, maximumStock: 15 },

      // Lácteos
      { name: 'Queso Edam', category: 'Lácteos', unit: 'kg', isPerishable: true, shelfLifeDays: 30, minimumStock: 5, maximumStock: 20 },
      { name: 'Queso Mozzarella', category: 'Lácteos', unit: 'kg', isPerishable: true, shelfLifeDays: 21, minimumStock: 5, maximumStock: 20 },
      { name: 'Mantequilla', category: 'Lácteos', unit: 'kg', isPerishable: true, shelfLifeDays: 60, minimumStock: 3, maximumStock: 15 },
      { name: 'Crema de Leche', category: 'Lácteos', unit: 'L', isPerishable: true, shelfLifeDays: 7, minimumStock: 5, maximumStock: 20 },

      // Panadería
      { name: 'Pan Ciabatta', category: 'Panadería', unit: 'un', isPerishable: true, shelfLifeDays: 2, minimumStock: 50, maximumStock: 200 },
      { name: 'Pan Francés', category: 'Panadería', unit: 'un', isPerishable: true, shelfLifeDays: 1, minimumStock: 40, maximumStock: 150 },
      { name: 'Pan de Hamburguesa', category: 'Panadería', unit: 'un', isPerishable: true, shelfLifeDays: 3, minimumStock: 30, maximumStock: 120 },
      { name: 'Harina sin Preparar', category: 'Panadería', unit: 'kg', isPerishable: false, shelfLifeDays: 180, minimumStock: 10, maximumStock: 50 },

      // Condimentos
      { name: 'Sal', category: 'Condimentos', unit: 'kg', isPerishable: false, minimumStock: 5, maximumStock: 20 },
      { name: 'Pimienta Negra', category: 'Condimentos', unit: 'g', isPerishable: false, minimumStock: 500, maximumStock: 2000 },
      { name: 'Ajo en Polvo', category: 'Condimentos', unit: 'g', isPerishable: false, minimumStock: 500, maximumStock: 2000 },
      { name: 'Mayonesa', category: 'Condimentos', unit: 'kg', isPerishable: true, shelfLifeDays: 60, minimumStock: 5, maximumStock: 25 },
      { name: 'Ketchup', category: 'Condimentos', unit: 'kg', isPerishable: true, shelfLifeDays: 90, minimumStock: 3, maximumStock: 15 },
      { name: 'Mostaza', category: 'Condimentos', unit: 'kg', isPerishable: true, shelfLifeDays: 90, minimumStock: 2, maximumStock: 10 },
      { name: 'Salsa Golf', category: 'Condimentos', unit: 'kg', isPerishable: true, shelfLifeDays: 45, minimumStock: 3, maximumStock: 15 },
      { name: 'Chimichurri', category: 'Condimentos', unit: 'kg', isPerishable: true, shelfLifeDays: 30, minimumStock: 2, maximumStock: 10 },

      // Bebidas
      { name: 'Coca Cola', category: 'Bebidas', unit: 'L', isPerishable: false, minimumStock: 20, maximumStock: 100 },
      { name: 'Inca Kola', category: 'Bebidas', unit: 'L', isPerishable: false, minimumStock: 20, maximumStock: 100 },
      { name: 'Sprite', category: 'Bebidas', unit: 'L', isPerishable: false, minimumStock: 15, maximumStock: 75 },
      { name: 'Agua Mineral', category: 'Bebidas', unit: 'L', isPerishable: false, minimumStock: 30, maximumStock: 150 },
      { name: 'Cerveza Pilsen', category: 'Bebidas', unit: 'L', isPerishable: false, minimumStock: 50, maximumStock: 200 },
      { name: 'Jugo de Naranja', category: 'Bebidas', unit: 'L', isPerishable: true, shelfLifeDays: 7, minimumStock: 10, maximumStock: 40 },

      // Aceites y Grasas
      { name: 'Aceite Vegetal', category: 'Aceites y Grasas', unit: 'L', isPerishable: false, minimumStock: 10, maximumStock: 50 },
      { name: 'Aceite de Oliva', category: 'Aceites y Grasas', unit: 'L', isPerishable: false, minimumStock: 3, maximumStock: 15 },

      // Granos y Legumbres
      { name: 'Arroz Blanco', category: 'Granos y Legumbres', unit: 'kg', isPerishable: false, minimumStock: 20, maximumStock: 100 },
      { name: 'Frijoles Canarios', category: 'Granos y Legumbres', unit: 'kg', isPerishable: false, minimumStock: 10, maximumStock: 50 },

      // Frutas
      { name: 'Limón', category: 'Frutas', unit: 'kg', isPerishable: true, shelfLifeDays: 10, minimumStock: 5, maximumStock: 25 },
      { name: 'Piña', category: 'Frutas', unit: 'un', isPerishable: true, shelfLifeDays: 7, minimumStock: 10, maximumStock: 40 },

      // Otros
      { name: 'Huevo', category: 'Otros', unit: 'un', isPerishable: true, shelfLifeDays: 30, minimumStock: 100, maximumStock: 500 }
    ]

    const ingredients: Partial<IngredientEntity>[] = ingredientDefinitions.map(def => {
      const category = categoryMap.get(def.category)
      const unit = unitMap.get(def.unit)

      if (!category || !unit) {
        throw new Error(`Missing category or unit for ${def.name}`)
      }

      return {
        id: uuid(),
        name: def.name,
        description: faker.commerce.productDescription(),
        ingredientCategoryId: category.id,
        unitId: unit.id,
        preferredSupplierId: null,
        minimumStock: def.minimumStock || null,
        maximumStock: def.maximumStock || null,
        isPerishable: def.isPerishable,
        shelfLifeDays: def.shelfLifeDays || null,
        storageLocation: def.isPerishable ? faker.helpers.arrayElement(['Refrigerador', 'Congelador', 'Almacén Frío']) : 'Almacén Seco',
        isActive: true
      }
    })

    await ingredientRepo.save(ingredients)

    console.log(`✅ Seeded ${ingredients.length} ingredients`)
  }
}

import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { Seeder } from './seeder.interface'
import { RecipeEntity } from '@contexts/kitchen/recipe/infrastructure/persistence/typeorm/recipe.entity'
import { RecipeItemEntity } from '@contexts/kitchen/recipe/infrastructure/persistence/typeorm/recipe-item.entity'
import { IngredientEntity } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'
import { UnitEntity } from '@contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

interface RecipeDefinition {
  name: string
  description: string
  yieldQuantity: number
  yieldUnit: string
  items: {
    ingredient: string
    quantity: number
    unit: string
  }[]
}

export class RecipeSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const recipeRepo = dataSource.getRepository(RecipeEntity)

    // Check if recipes already exist
    const count = await recipeRepo.count()
    if (count > 0) {
      console.log('⏭️  Recipes already seeded, skipping...')
      return
    }

    // Get ingredients and units
    const ingredientRepo = dataSource.getRepository(IngredientEntity)
    const unitRepo = dataSource.getRepository(UnitEntity)
    const recipeItemRepo = dataSource.getRepository(RecipeItemEntity)

    const ingredients = await ingredientRepo.find()
    const units = await unitRepo.find()

    const ingredientMap = new Map(ingredients.map(i => [i.name, i]))
    const unitMap = new Map(units.map(u => [u.symbol, u]))

    const recipeDefinitions: RecipeDefinition[] = [
      {
        name: 'Sanguch Clásico de Pollo',
        description: 'Sanguch de pechuga de pollo con vegetales frescos',
        yieldQuantity: 1,
        yieldUnit: 'un',
        items: [
          { ingredient: 'Pan Ciabatta', quantity: 1, unit: 'un' },
          { ingredient: 'Pechuga de Pollo', quantity: 150, unit: 'g' },
          { ingredient: 'Lechuga Americana', quantity: 30, unit: 'g' },
          { ingredient: 'Tomate', quantity: 40, unit: 'g' },
          { ingredient: 'Mayonesa', quantity: 20, unit: 'g' },
          { ingredient: 'Queso Edam', quantity: 30, unit: 'g' }
        ]
      },
      {
        name: 'Sanguch de Carne',
        description: 'Sanguch de carne molida con queso derretido',
        yieldQuantity: 1,
        yieldUnit: 'un',
        items: [
          { ingredient: 'Pan Ciabatta', quantity: 1, unit: 'un' },
          { ingredient: 'Carne Molida de Res', quantity: 180, unit: 'g' },
          { ingredient: 'Queso Mozzarella', quantity: 40, unit: 'g' },
          { ingredient: 'Cebolla Morada', quantity: 30, unit: 'g' },
          { ingredient: 'Tomate', quantity: 30, unit: 'g' },
          { ingredient: 'Mayonesa', quantity: 15, unit: 'g' },
          { ingredient: 'Ketchup', quantity: 10, unit: 'g' }
        ]
      },
      {
        name: 'Sanguch Especial con Palta',
        description: 'Sanguch premium con palta y tocino',
        yieldQuantity: 1,
        yieldUnit: 'un',
        items: [
          { ingredient: 'Pan Ciabatta', quantity: 1, unit: 'un' },
          { ingredient: 'Pechuga de Pollo', quantity: 150, unit: 'g' },
          { ingredient: 'Palta Hass', quantity: 0.5, unit: 'un' },
          { ingredient: 'Tocino', quantity: 40, unit: 'g' },
          { ingredient: 'Lechuga Americana', quantity: 30, unit: 'g' },
          { ingredient: 'Tomate', quantity: 30, unit: 'g' },
          { ingredient: 'Mayonesa', quantity: 20, unit: 'g' }
        ]
      },
      {
        name: 'Hamburguesa Clásica',
        description: 'Hamburguesa de carne con queso',
        yieldQuantity: 1,
        yieldUnit: 'un',
        items: [
          { ingredient: 'Pan de Hamburguesa', quantity: 1, unit: 'un' },
          { ingredient: 'Carne Molida de Res', quantity: 200, unit: 'g' },
          { ingredient: 'Queso Edam', quantity: 40, unit: 'g' },
          { ingredient: 'Lechuga Americana', quantity: 20, unit: 'g' },
          { ingredient: 'Tomate', quantity: 30, unit: 'g' },
          { ingredient: 'Cebolla Morada', quantity: 20, unit: 'g' },
          { ingredient: 'Ketchup', quantity: 15, unit: 'g' },
          { ingredient: 'Mostaza', quantity: 10, unit: 'g' }
        ]
      },
      {
        name: 'Bowl de Pollo',
        description: 'Bowl saludable con pollo y vegetales',
        yieldQuantity: 1,
        yieldUnit: 'un',
        items: [
          { ingredient: 'Pechuga de Pollo', quantity: 200, unit: 'g' },
          { ingredient: 'Arroz Blanco', quantity: 150, unit: 'g' },
          { ingredient: 'Lechuga Americana', quantity: 50, unit: 'g' },
          { ingredient: 'Tomate', quantity: 40, unit: 'g' },
          { ingredient: 'Palta Hass', quantity: 0.5, unit: 'un' },
          { ingredient: 'Zanahoria', quantity: 30, unit: 'g' },
          { ingredient: 'Pepino', quantity: 30, unit: 'g' },
          { ingredient: 'Limón', quantity: 0.25, unit: 'un' }
        ]
      },
      {
        name: 'Alitas BBQ',
        description: 'Alitas de pollo con salsa barbecue',
        yieldQuantity: 6,
        yieldUnit: 'un',
        items: [
          { ingredient: 'Pechuga de Pollo', quantity: 500, unit: 'g' },
          { ingredient: 'Ketchup', quantity: 50, unit: 'g' },
          { ingredient: 'Mantequilla', quantity: 30, unit: 'g' },
          { ingredient: 'Ajo en Polvo', quantity: 5, unit: 'g' },
          { ingredient: 'Sal', quantity: 3, unit: 'g' },
          { ingredient: 'Pimienta Negra', quantity: 2, unit: 'g' }
        ]
      }
    ]

    // Create recipes and their items
    for (const def of recipeDefinitions) {
      const yieldUnit = unitMap.get(def.yieldUnit)
      if (!yieldUnit) {
        console.log(`⚠️  Skipping recipe ${def.name}: yield unit not found`)
        continue
      }

      const recipeId = uuid()
      const recipe: Partial<RecipeEntity> = {
        id: recipeId,
        name: def.name,
        description: def.description,
        yieldQuantity: def.yieldQuantity,
        yieldUnitId: yieldUnit.id,
        yieldDescription: `${def.yieldQuantity} ${def.yieldUnit}`,
        isActive: true
      }

      await recipeRepo.save(recipe)

      // Create recipe items
      const items: Partial<RecipeItemEntity>[] = []
      let sortOrder = 1

      for (const itemDef of def.items) {
        const ingredient = ingredientMap.get(itemDef.ingredient)
        const unit = unitMap.get(itemDef.unit)

        if (!ingredient || !unit) {
          console.log(`⚠️  Skipping item ${itemDef.ingredient} in ${def.name}: not found`)
          continue
        }

        items.push({
          id: uuid(),
          recipeId,
          ingredientId: ingredient.id,
          quantity: itemDef.quantity,
          unitId: unit.id,
          sortOrder: sortOrder++
        })
      }

      if (items.length > 0) {
        await recipeItemRepo.save(items)
      }
    }

    console.log(`✅ Seeded ${recipeDefinitions.length} recipes`)
  }
}

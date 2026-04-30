import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { faker } from '@faker-js/faker'
import { Seeder } from './seeder.interface'
import { InventoryLevelEntity } from '@contexts/inventory/stock-level/infrastructure/persistence/typeorm/inventory-level.entity'
import { IngredientEntity } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'

export class InventoryLevelSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const levelRepo = dataSource.getRepository(InventoryLevelEntity)

    const count = await levelRepo.count()
    if (count > 0) {
      console.log('⏭️  Inventory levels already seeded, skipping...')
      return
    }

    const ingredientRepo = dataSource.getRepository(IngredientEntity)
    const ingredients = await ingredientRepo.find()

    if (ingredients.length === 0) {
      throw new Error('No ingredients found. Run IngredientSeeder first.')
    }

    const levels: Partial<InventoryLevelEntity>[] = ingredients.map(ingredient => {
      const minStock = ingredient.minimumStock ?? 5
      const maxStock = ingredient.maximumStock ?? minStock * 4
      const reorderPoint = Math.round(minStock * 1.5)
      const currentQuantity = faker.number.float({
        min: minStock * 0.5,
        max: maxStock * 0.8,
        fractionDigits: 2
      })

      return {
        id: uuid(),
        ingredientId: ingredient.id,
        currentQuantity,
        unitId: ingredient.unitId,
        minimumQuantity: minStock,
        maximumQuantity: maxStock,
        reorderPoint
      }
    })

    await levelRepo.save(levels)

    console.log(`✅ Seeded ${levels.length} inventory levels`)
  }
}

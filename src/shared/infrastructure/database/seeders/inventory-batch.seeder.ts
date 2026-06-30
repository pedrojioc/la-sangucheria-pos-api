import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { faker } from '@faker-js/faker'
import { Seeder } from './seeder.interface'
import { InventoryBatchEntity } from '@contexts/inventory/batch/infrastructure/persistence/typeorm/inventory-batch.entity'
import { IngredientEntity } from '@contexts/inventory/ingredient/infrastructure/persistence/typeorm/ingredient.entity'

export class InventoryBatchSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const batchRepo = dataSource.getRepository(InventoryBatchEntity)

    // Check if batches already exist
    const count = await batchRepo.count()
    if (count > 0) {
      console.log('⏭️  Inventory batches already seeded, skipping...')
      return
    }

    // Get all ingredients
    const ingredientRepo = dataSource.getRepository(IngredientEntity)
    const ingredients = await ingredientRepo.find()

    const batches: Partial<InventoryBatchEntity>[] = []

    // Create 1-3 batches per ingredient
    for (const ingredient of ingredients) {
      const batchCount = faker.number.int({ min: 1, max: 3 })

      for (let i = 0; i < batchCount; i++) {
        const initialQuantity = faker.number.float({ min: 10, max: 100, fractionDigits: 2 })
        const consumedPercentage = faker.number.float({ min: 0, max: 0.6, fractionDigits: 2 })
        const remainingQuantity = parseFloat(
          (initialQuantity * (1 - consumedPercentage)).toFixed(2)
        )

        const purchaseDate = faker.date.past({ years: 0.25 }) // Last 3 months
        const expirationDate =
          ingredient.isPerishable && ingredient.shelfLifeDays
            ? new Date(purchaseDate.getTime() + ingredient.shelfLifeDays * 24 * 60 * 60 * 1000)
            : null

        // Generate realistic unit cost based on ingredient type
        const unitCost = faker.number.float({ min: 1, max: 50, fractionDigits: 2 })

        batches.push({
          id: uuid(),
          ingredientId: ingredient.id,
          initialQuantity,
          remainingQuantity,
          unitId: ingredient.unitId,
          unitCost,
          currency: 'COP',
          purchaseDate,
          expirationDate,
          supplierId: null,
          referenceCode: `BATCH-${faker.string.alphanumeric(8).toUpperCase()}`
        })
      }
    }

    await batchRepo.save(batches)

    console.log(`✅ Seeded ${batches.length} inventory batches`)
  }
}

import { DataSource } from 'typeorm'
import { config } from 'dotenv'
import { Seeder } from './seeder.interface'
import { UnitSeeder } from './unit.seeder'
import { UnitConversionSeeder } from './unit-conversion.seeder'
import { IngredientCategorySeeder } from './ingredient-category.seeder'
import { IngredientSeeder } from './ingredient.seeder'
import { ProductCategorySeeder } from './product-category.seeder'
import { RecipeSeeder } from './recipe.seeder'
import { ProductSeeder } from './product.seeder'
import { InventoryBatchSeeder } from './inventory-batch.seeder'

// Load environment variables
config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
})

// Create DataSource
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'la_sangucheria_pos',
  schema: process.env.DB_SCHEMA || 'public',
  entities: [__dirname + '/../../../../**/*.entity{.ts,.js}'],
  synchronize: false,
  logging: false
})

async function runSeeders() {
  console.log('🌱 Starting database seeding...\n')

  try {
    // Initialize DataSource
    await AppDataSource.initialize()
    console.log('✅ Database connection established\n')

    // Define seeders in dependency order
    const seeders: Seeder[] = [
      new UnitSeeder(),                    // 1. No dependencies
      new UnitConversionSeeder(),          // 2. Depends on: Units
      new IngredientCategorySeeder(),      // 3. No dependencies
      new IngredientSeeder(),              // 4. Depends on: Units, IngredientCategories
      new ProductCategorySeeder(),         // 5. No dependencies
      new RecipeSeeder(),                  // 6. Depends on: Ingredients, Units
      new ProductSeeder(),                 // 7. Depends on: ProductCategories, Recipes
      new InventoryBatchSeeder()           // 8. Depends on: Ingredients
    ]

    // Run each seeder
    for (const seeder of seeders) {
      const seederName = seeder.constructor.name
      console.log(`🌱 Running ${seederName}...`)
      await seeder.run(AppDataSource)
      console.log('')
    }

    console.log('✅ Database seeding completed successfully!\n')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  } finally {
    await AppDataSource.destroy()
    console.log('👋 Database connection closed')
  }
}

// Run seeders
runSeeders()

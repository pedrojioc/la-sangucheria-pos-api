import { DataSource } from 'typeorm'
import { config } from 'dotenv'

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

async function clearAndReseed() {
  console.log('🧹 Clearing database tables...\n')

  try {
    await AppDataSource.initialize()
    console.log('✅ Database connection established\n')

    // Tables to clear in reverse dependency order
    const tablesToClear = [
      'inventory_batches',
      'products',
      'recipe_items',
      'recipes',
      'product_categories',
      'ingredients',
      'ingredient_categories',
      'unit_conversions',
      'units'
    ]

    for (const table of tablesToClear) {
      await AppDataSource.query(`TRUNCATE TABLE ${table} CASCADE`)
      console.log(`🗑️  Cleared ${table}`)
    }

    console.log('\n✅ All tables cleared successfully!\n')
    console.log('Now run: pnpm seed:run\n')
  } catch (error) {
    console.error('❌ Error during clearing:', error)
    process.exit(1)
  } finally {
    await AppDataSource.destroy()
  }
}

clearAndReseed()

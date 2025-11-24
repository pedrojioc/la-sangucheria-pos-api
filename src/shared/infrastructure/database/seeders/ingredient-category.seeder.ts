import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { Seeder } from './seeder.interface'
import { IngredientCategoryEntity } from '@contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/ingredient-category.entity'

export class IngredientCategorySeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(IngredientCategoryEntity)

    // Check if categories already exist
    const count = await repository.count()
    if (count > 0) {
      console.log('⏭️  Ingredient categories already seeded, skipping...')
      return
    }

    const categories: Partial<IngredientCategoryEntity>[] = [
      {
        id: uuid(),
        name: 'Carnes',
        description: 'Carnes rojas, blancas y procesadas',
        icon: '🥩',
        color: '#e74c3c',
        sortOrder: 1,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Verduras',
        description: 'Verduras frescas y vegetales',
        icon: '🥬',
        color: '#27ae60',
        sortOrder: 2,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Lácteos',
        description: 'Leche, quesos, yogurt y derivados',
        icon: '🧀',
        color: '#f39c12',
        sortOrder: 3,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Panadería',
        description: 'Panes, harinas y productos de panadería',
        icon: '🍞',
        color: '#d35400',
        sortOrder: 4,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Condimentos',
        description: 'Especias, salsas y aderezos',
        icon: '🧂',
        color: '#8e44ad',
        sortOrder: 5,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Bebidas',
        description: 'Bebidas alcohólicas y no alcohólicas',
        icon: '🥤',
        color: '#3498db',
        sortOrder: 6,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Aceites y Grasas',
        description: 'Aceites vegetales, mantequilla y grasas',
        icon: '🫒',
        color: '#f1c40f',
        sortOrder: 7,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Granos y Legumbres',
        description: 'Arroz, frijoles, lentejas y granos',
        icon: '🌾',
        color: '#95a5a6',
        sortOrder: 8,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Frutas',
        description: 'Frutas frescas y procesadas',
        icon: '🍎',
        color: '#e67e22',
        sortOrder: 9,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Otros',
        description: 'Ingredientes misceláneos',
        icon: '📦',
        color: '#34495e',
        sortOrder: 10,
        isActive: true
      }
    ]

    await repository.save(categories)

    console.log(`✅ Seeded ${categories.length} ingredient categories`)
  }
}

import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { Seeder } from './seeder.interface'
import { ProductCategoryEntity } from '@contexts/menu/product-category/infrastructure/persistence/typeorm/product-category.entity'

export class ProductCategorySeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(ProductCategoryEntity)

    // Check if categories already exist
    const count = await repository.count()
    if (count > 0) {
      console.log('⏭️  Product categories already seeded, skipping...')
      return
    }

    const categories: Partial<ProductCategoryEntity>[] = [
      {
        id: uuid(),
        name: 'Sanguches',
        description: 'Deliciosos sanguches artesanales',
        icon: '🥪',
        displayOrder: 1,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Bowls',
        description: 'Bowls saludables y nutritivos',
        icon: '🥗',
        displayOrder: 2,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Alitas',
        description: 'Alitas de pollo crujientes',
        icon: '🍗',
        displayOrder: 3,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Hamburguesas',
        description: 'Hamburguesas gourmet',
        icon: '🍔',
        displayOrder: 4,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Bebidas',
        description: 'Bebidas frías y calientes',
        icon: '🥤',
        displayOrder: 5,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Cocteles',
        description: 'Cocteles artesanales',
        icon: '🍹',
        displayOrder: 6,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Postres',
        description: 'Postres caseros',
        icon: '🍰',
        displayOrder: 7,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Ensaladas',
        description: 'Ensaladas frescas',
        icon: '🥬',
        displayOrder: 8,
        isActive: true
      },
      {
        id: uuid(),
        name: 'Acompañamientos',
        description: 'Guarniciones y complementos',
        icon: '🍟',
        displayOrder: 9,
        isActive: true
      }
    ]

    await repository.save(categories)

    console.log(`✅ Seeded ${categories.length} product categories`)
  }
}

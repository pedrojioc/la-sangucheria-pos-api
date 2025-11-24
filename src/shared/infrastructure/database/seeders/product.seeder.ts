import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { faker } from '@faker-js/faker'
import { Seeder } from './seeder.interface'
import { ProductEntity } from '@contexts/menu/product/infrastructure/persistence/typeorm/product.entity'
import { ProductCategoryEntity } from '@contexts/menu/product-category/infrastructure/persistence/typeorm/product-category.entity'
import { RecipeEntity } from '@contexts/kitchen/recipe/infrastructure/persistence/typeorm/recipe.entity'

interface ProductDefinition {
  name: string
  category: string
  recipe?: string
  price: number
  preparationTime: number
  tags: string[]
}

export class ProductSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const productRepo = dataSource.getRepository(ProductEntity)

    // Check if products already exist
    const count = await productRepo.count()
    if (count > 0) {
      console.log('⏭️  Products already seeded, skipping...')
      return
    }

    // Get categories and recipes
    const categoryRepo = dataSource.getRepository(ProductCategoryEntity)
    const recipeRepo = dataSource.getRepository(RecipeEntity)

    const categories = await categoryRepo.find()
    const recipes = await recipeRepo.find()

    const categoryMap = new Map(categories.map(c => [c.name, c]))
    const recipeMap = new Map(recipes.map(r => [r.name, r]))

    const productDefinitions: ProductDefinition[] = [
      // Sanguches
      {
        name: 'Sanguch Clásico de Pollo',
        category: 'Sanguches',
        recipe: 'Sanguch Clásico de Pollo',
        price: 15.00,
        preparationTime: 10,
        tags: ['pollo', 'clásico', 'popular']
      },
      {
        name: 'Sanguch de Carne Premium',
        category: 'Sanguches',
        recipe: 'Sanguch de Carne',
        price: 18.00,
        preparationTime: 12,
        tags: ['carne', 'premium', 'queso']
      },
      {
        name: 'Sanguch Especial con Palta',
        category: 'Sanguches',
        recipe: 'Sanguch Especial con Palta',
        price: 22.00,
        preparationTime: 15,
        tags: ['palta', 'tocino', 'especial', 'premium']
      },

      // Hamburguesas
      {
        name: 'Hamburguesa Clásica',
        category: 'Hamburguesas',
        recipe: 'Hamburguesa Clásica',
        price: 16.00,
        preparationTime: 12,
        tags: ['hamburguesa', 'clásica', 'queso']
      },

      // Bowls
      {
        name: 'Bowl de Pollo Saludable',
        category: 'Bowls',
        recipe: 'Bowl de Pollo',
        price: 20.00,
        preparationTime: 15,
        tags: ['bowl', 'saludable', 'pollo', 'palta']
      },

      // Alitas
      {
        name: 'Alitas BBQ (6 unidades)',
        category: 'Alitas',
        recipe: 'Alitas BBQ',
        price: 18.00,
        preparationTime: 20,
        tags: ['alitas', 'bbq', 'picante']
      },

      // Bebidas (sin receta)
      {
        name: 'Coca Cola 500ml',
        category: 'Bebidas',
        price: 5.00,
        preparationTime: 1,
        tags: ['bebida', 'gaseosa', 'coca-cola']
      },
      {
        name: 'Inca Kola 500ml',
        category: 'Bebidas',
        price: 5.00,
        preparationTime: 1,
        tags: ['bebida', 'gaseosa', 'inca-kola']
      },
      {
        name: 'Agua Mineral 500ml',
        category: 'Bebidas',
        price: 3.00,
        preparationTime: 1,
        tags: ['bebida', 'agua', 'mineral']
      },
      {
        name: 'Jugo de Naranja Natural',
        category: 'Bebidas',
        price: 7.00,
        preparationTime: 5,
        tags: ['bebida', 'jugo', 'natural', 'naranja']
      },

      // Cocteles (sin receta por ahora)
      {
        name: 'Pisco Sour',
        category: 'Cocteles',
        price: 15.00,
        preparationTime: 5,
        tags: ['coctel', 'pisco', 'peruano']
      },
      {
        name: 'Chilcano',
        category: 'Cocteles',
        price: 12.00,
        preparationTime: 3,
        tags: ['coctel', 'pisco', 'refrescante']
      },

      // Acompañamientos (sin receta)
      {
        name: 'Papas Fritas',
        category: 'Acompañamientos',
        price: 8.00,
        preparationTime: 8,
        tags: ['acompañamiento', 'papas', 'fritas']
      },
      {
        name: 'Yucas Fritas',
        category: 'Acompañamientos',
        price: 8.00,
        preparationTime: 10,
        tags: ['acompañamiento', 'yuca', 'fritas']
      }
    ]

    const products: Partial<ProductEntity>[] = []
    let skuCounter = 1000

    for (const def of productDefinitions) {
      const category = categoryMap.get(def.category)
      if (!category) {
        console.log(`⚠️  Skipping product ${def.name}: category not found`)
        continue
      }

      const recipe = def.recipe ? recipeMap.get(def.recipe) : null

      products.push({
        id: uuid(),
        name: def.name,
        description: faker.commerce.productDescription(),
        categoryId: category.id,
        recipeId: recipe?.id || null,
        price: def.price,
        imageUrl: null,
        imageStorageKey: null,
        preparationTime: def.preparationTime,
        isActive: true,
        displayOrder: products.length + 1,
        sku: `PROD-${skuCounter++}`,
        tags: def.tags,
        inventoryStrategyType: recipe ? 'RECIPE' : 'DIRECT'
      })
    }

    await productRepo.save(products)

    console.log(`✅ Seeded ${products.length} products`)
  }
}

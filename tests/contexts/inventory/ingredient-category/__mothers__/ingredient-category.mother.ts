import { faker } from '@faker-js/faker'
import {
  IngredientCategory,
  IngredientCategoryPrimitives
} from '@/contexts/inventory/ingredient-category/domain/ingredient-category'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class IngredientCategoryMother {
  static create(params: Partial<IngredientCategoryPrimitives> = {}): IngredientCategory {
    const primitives: IngredientCategoryPrimitives = {
      id: params.id ?? UuidMother.random(),
      name: params.name ?? faker.commerce.department(),
      description: params.description !== undefined ? params.description : faker.lorem.sentence(),
      icon: params.icon !== undefined ? params.icon : null,
      color: params.color !== undefined ? params.color : null,
      sortOrder: params.sortOrder !== undefined ? params.sortOrder : null,
      isActive: params.isActive ?? true
    }
    return IngredientCategory.fromPrimitives(primitives)
  }

  static random(): IngredientCategory {
    return this.create()
  }

  static withName(name: string): IngredientCategory {
    return this.create({ name })
  }

  static inactive(): IngredientCategory {
    return this.create({ isActive: false })
  }

  static carnes(): IngredientCategory {
    return this.create({
      name: 'Carnes',
      description: 'Ingredientes cárnicos',
      icon: 'meat',
      color: '#FF5733',
      sortOrder: 1,
      isActive: true
    })
  }

  static vegetales(): IngredientCategory {
    return this.create({
      name: 'Vegetales',
      description: 'Ingredientes vegetales frescos',
      icon: 'leaf',
      color: '#33FF57',
      sortOrder: 2,
      isActive: true
    })
  }

  static minimal(): IngredientCategory {
    return this.create({ description: null, icon: null, color: null, sortOrder: null })
  }
}

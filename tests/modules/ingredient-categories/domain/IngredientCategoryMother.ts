import {
  IngredientCategory,
  IngredientCategoryPrimitives
} from '@contexts/inventory/ingredient-category/domain/ingredient-category'
import { IngredientCategoryIdMother } from './IngredientCategoryIdMother'
import { IngredientCategoryNameMother } from './IngredientCategoryNameMother'
import { IngredientCategoryDescriptionMother } from './IngredientCategoryDescriptionMother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { StringMother } from '@test/shared/__mothers__/StringMother'
import { BooleanMother } from '@test/shared/__mothers__/BooleanMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'

export class IngredientCategoryMother {
  static create(params: Partial<IngredientCategoryPrimitives> = {}): IngredientCategory {
    const primitives: IngredientCategoryPrimitives = {
      id: params.id ?? UuidMother.random(),
      name: params.name ?? StringMother.random({ min: 2, max: 100 }),
      description: params.description ?? StringMother.sentence(),
      icon: params.icon ?? null,
      color: params.color ?? null,
      sortOrder: params.sortOrder ?? null,
      isActive: params.isActive ?? true
    }

    return IngredientCategory.fromPrimitives(primitives)
  }

  static random(): IngredientCategory {
    return this.create()
  }

  static withId(id: string): IngredientCategory {
    return this.create({ id })
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
}

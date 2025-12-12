import { Recipe } from '@contexts/kitchen/recipe/domain/recipe'

export class RecipeItemResponse {
  ingredientId: string
  quantity: number
  unitId: string

  constructor(data: { ingredientId: string; quantity: number; unitId: string }) {
    this.ingredientId = data.ingredientId
    this.quantity = data.quantity
    this.unitId = data.unitId
  }
}

export class RecipeYieldResponse {
  value: number
  unitId: string
  description: string | null

  constructor(data: { value: number; unitId: string; description: string | null }) {
    this.value = data.value
    this.unitId = data.unitId
    this.description = data.description
  }
}

export class RecipeResponse {
  id: string
  name: string
  description: string | null
  items: RecipeItemResponse[]
  recipeYield: RecipeYieldResponse
  isActive: boolean
  createdAt: Date
  updatedAt: Date

  constructor(data: {
    id: string
    name: string
    description: string | null
    items: RecipeItemResponse[]
    recipeYield: RecipeYieldResponse
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = data.id
    this.name = data.name
    this.description = data.description
    this.items = data.items
    this.recipeYield = data.recipeYield
    this.isActive = data.isActive
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  static fromDomain(recipe: Recipe): RecipeResponse {
    const primitives = recipe.toPrimitives()

    return new RecipeResponse({
      id: primitives.id,
      name: primitives.name,
      description: primitives.description,
      items: primitives.items.map(
        item =>
          new RecipeItemResponse({
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unitId: item.unitId
          })
      ),
      recipeYield: new RecipeYieldResponse({
        value: primitives.recipeYield.value,
        unitId: primitives.recipeYield.unitId,
        description: primitives.recipeYield.description
      }),
      isActive: primitives.isActive,
      createdAt: primitives.createdAt,
      updatedAt: primitives.updatedAt
    })
  }
}

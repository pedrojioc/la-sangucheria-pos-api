import { PreparationRecipe } from '@contexts/kitchen/transformation/domain/preparation-recipe'
import { PreparationRecipeId } from '@contexts/kitchen/transformation/domain/preparation-recipe-id'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { Quantity } from '@/shared/domain/value-objects/quantity'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'
import { NumberMother } from '@test/shared/__mothers__/NumberMother'
import { StringMother } from '@test/shared/__mothers__/StringMother'

export class TransformationRecipeMother {
  static create(params: Partial<{
    id: string
    baseIngredientId: string
    outputIngredientId: string
    yieldPercentage: number
    name: string
    description: string | null
  }> = {}): PreparationRecipe {
    const id = params.id ?? UuidMother.random()
    const baseIngredientId = params.baseIngredientId ?? UuidMother.random()
    const outputIngredientId = params.outputIngredientId ?? UuidMother.random()
    const yieldPercentage = params.yieldPercentage ?? NumberMother.random({ min: 30, max: 80 })
    const name = params.name ?? StringMother.random()
    const description = params.description === undefined ? StringMother.sentence() : params.description

    return PreparationRecipe.create(
      id,
      name,
      baseIngredientId,
      outputIngredientId,
      yieldPercentage,
      [],
      description
    )
  }

  static random(): PreparationRecipe {
    return this.create()
  }

  static withBaseIngredient(baseIngredientId: string): PreparationRecipe {
    return this.create({ baseIngredientId })
  }

  static withOutputIngredient(outputIngredientId: string): PreparationRecipe {
    return this.create({ outputIngredientId })
  }

  static withYieldPercentage(yieldPercentage: number): PreparationRecipe {
    return this.create({ yieldPercentage })
  }

  static withDescription(description: string): PreparationRecipe {
    return this.create({ description })
  }
}

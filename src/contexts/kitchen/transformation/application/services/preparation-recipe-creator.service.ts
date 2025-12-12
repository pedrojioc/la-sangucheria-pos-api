import { CreateIngredient } from '@contexts/inventory/ingredient/application/create/create-ingredient'
import { CreatePreparationRecipe } from '../create/create-preparation-recipe'
import { FindIngredient } from '@/contexts/inventory/ingredient/application/find/find-ingredient'

/**
 * PreparationRecipeCreatorService
 *
 * Application Service (CodelyTV pattern) for orchestrating the creation of
 * a preparation recipe along with its required ingredients.
 *
 * This service coordinates multiple Use Cases across different Bounded Contexts:
 * - Inventory Context: CreateIngredient
 * - Kitchen Context: CreatePreparationRecipe
 *
 * Use this service when you need to create a complete "prepared ingredient"
 * workflow (base ingredient → transformation recipe → output ingredient).
 *
 * For simple recipe creation (when ingredients already exist), use the
 * CreatePreparationRecipe Use Case directly.
 *
 * @example
 * // Create "Cooked Chicken" from "Raw Chicken"
 * await service.createWithIngredients({
 *   createBaseIngredient: false,  // Raw chicken already exists
 *   baseIngredientId: 'raw-chicken-uuid',
 *   outputIngredientData: {
 *     id: 'cooked-chicken-uuid',
 *     name: 'Cooked Chicken',
 *     ...
 *   },
 *   recipeData: {
 *     yieldPercentage: 85,
 *     additionalIngredients: [...]
 *   }
 * })
 */
export class PreparationRecipeCreatorService {
  constructor(
    private readonly createIngredient: CreateIngredient,
    private readonly createPreparationRecipe: CreatePreparationRecipe,
    private readonly findIngredient: FindIngredient
  ) {}

  async createWithIngredients(params: {
    // Recipe data
    recipeId: string
    recipeName: string
    recipeDescription: string | null

    // Base ingredient (input)
    baseIngredientId: string

    // Output ingredient (always created)
    outputIngredientId: string
    outputIngredientData: {
      name: string
      description: string | null
      categoryId: string
      unitId: string
      preferredSupplierId: string | null
      minimumStock: number | null
      maximumStock: number | null
      isPerishable: boolean
      shelfLifeDays: number | null
      storageLocation: string | null
      isActive: boolean
    }

    // Recipe transformation data
    yieldPercentage: number
    additionalIngredients: Array<{
      ingredientId: string
      quantityPerUnit: number
      unitId: string
    }>
  }): Promise<void> {
    // 1. Ensure base ingredient exists
    await this.findIngredient.run(params.baseIngredientId)

    // 2. Create output ingredient (always)
    await this.createIngredient.run(
      params.outputIngredientId,
      params.outputIngredientData.name,
      params.outputIngredientData.description,
      params.outputIngredientData.categoryId,
      params.outputIngredientData.unitId,
      params.outputIngredientData.preferredSupplierId,
      params.outputIngredientData.minimumStock,
      params.outputIngredientData.maximumStock,
      params.outputIngredientData.isPerishable,
      params.outputIngredientData.shelfLifeDays,
      params.outputIngredientData.storageLocation,
      params.outputIngredientData.isActive
    )

    // 3. Create preparation recipe
    await this.createPreparationRecipe.run(
      params.recipeId,
      params.recipeName,
      params.baseIngredientId,
      params.outputIngredientId,
      params.yieldPercentage,
      params.additionalIngredients,
      params.recipeDescription
    )
  }
}

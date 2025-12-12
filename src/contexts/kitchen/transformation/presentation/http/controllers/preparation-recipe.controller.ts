import { Controller, Post, Body } from '@nestjs/common'
import { CommandBus } from '@nestjs/cqrs'
import { CreatePreparationRecipeRequest } from '../dto/create-preparation-recipe.request'
import { CreatePreparationRecipeBulkRequest } from '../dto/create-preparation-recipe-bulk.request'
import { CreatePreparationRecipeCommand } from '@contexts/kitchen/transformation/application/create/create-preparation-recipe.command'
import { PreparationRecipeCreatorService } from '@contexts/kitchen/transformation/application/services/preparation-recipe-creator.service'

/**
 * PreparationRecipeController
 *
 * Manages preparation recipes (transformation recipes) in the Kitchen context.
 *
 * A preparation recipe defines how to transform a base ingredient (e.g., raw chicken)
 * into an output ingredient (e.g., cooked shredded chicken) with a specific yield
 * percentage and optional additional ingredients.
 *
 * Endpoints:
 * - POST /preparation-recipes: Create recipe (assumes ingredients exist)
 * - POST /preparation-recipes/bulk: Create recipe with ingredients (orchestration)
 */
@Controller('preparation-recipes')
export class PreparationRecipeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly creatorService: PreparationRecipeCreatorService
  ) {}

  /**
   * Create a preparation recipe (simple endpoint)
   *
   * Use this when all ingredients (base and output) already exist in the system.
   *
   * @example
   * POST /preparation-recipes
   * {
   *   "id": "uuid",
   *   "name": "Cook and Shred Chicken",
   *   "baseIngredientId": "raw-chicken-uuid",
   *   "outputIngredientId": "cooked-chicken-uuid",
   *   "yieldPercentage": 85,
   *   "additionalIngredients": [
   *     { "ingredientId": "salt-uuid", "quantityPerUnit": 5, "unitId": "g-uuid" }
   *   ]
   * }
   */
  @Post()
  async create(@Body() dto: CreatePreparationRecipeRequest): Promise<void> {
    const command = new CreatePreparationRecipeCommand(
      dto.id,
      dto.name,
      dto.baseIngredientId,
      dto.outputIngredientId,
      dto.yieldPercentage,
      dto.additionalIngredients.map(item => ({
        ingredientId: item.ingredientId,
        quantityPerUnit: item.quantityPerUnit,
        unitId: item.unitId
      })),
      dto.description ?? null
    )

    await this.commandBus.execute(command)
  }

  /**
   * Create a preparation recipe with ingredients (bulk/orchestration endpoint)
   *
   * Use this when you need to create the output ingredient (and optionally the base)
   * along with the recipe. This is a convenience endpoint that orchestrates multiple
   * operations across Inventory and Kitchen contexts.
   *
   * @example
   * POST /preparation-recipes/bulk
   * {
   *   "recipeId": "uuid",
   *   "recipeName": "Cook and Shred Chicken",
   *   "createBaseIngredient": false,
   *   "baseIngredientId": "existing-raw-chicken-uuid",
   *   "outputIngredientId": "new-uuid",
   *   "outputIngredientData": {
   *     "name": "Cooked Shredded Chicken",
   *     "categoryId": "meat-uuid",
   *     "unitId": "kg-uuid",
   *     "isPerishable": true,
   *     "shelfLifeDays": 2,
   *     "isActive": true
   *   },
   *   "yieldPercentage": 85,
   *   "additionalIngredients": [...]
   * }
   */
  @Post('bulk')
  async createWithIngredients(@Body() dto: CreatePreparationRecipeBulkRequest): Promise<void> {
    await this.creatorService.createWithIngredients({
      recipeId: dto.recipeId,
      recipeName: dto.recipeName,
      recipeDescription: dto.recipeDescription ?? null,
      baseIngredientId: dto.baseIngredientId,
      outputIngredientId: dto.outputIngredientId,
      outputIngredientData: {
        name: dto.outputIngredientData.name,
        description: dto.outputIngredientData.description ?? null,
        categoryId: dto.outputIngredientData.categoryId,
        unitId: dto.outputIngredientData.unitId,
        preferredSupplierId: dto.outputIngredientData.preferredSupplierId ?? null,
        minimumStock: dto.outputIngredientData.minimumStock ?? null,
        maximumStock: dto.outputIngredientData.maximumStock ?? null,
        isPerishable: dto.outputIngredientData.isPerishable,
        shelfLifeDays: dto.outputIngredientData.shelfLifeDays ?? null,
        storageLocation: dto.outputIngredientData.storageLocation ?? null,
        isActive: dto.outputIngredientData.isActive
      },
      yieldPercentage: dto.yieldPercentage,
      additionalIngredients: dto.additionalIngredients.map(item => ({
        ingredientId: item.ingredientId,
        quantityPerUnit: item.quantityPerUnit,
        unitId: item.unitId
      }))
    })
  }
}

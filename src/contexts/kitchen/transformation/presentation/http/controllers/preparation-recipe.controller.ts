import { Controller, Post, Patch, Get, Body, Query, Param } from '@nestjs/common'
import { CreatePreparationRecipeRequest } from '../dto/create-preparation-recipe.request'
import { UpdatePreparationRecipeRequest } from '../dto/update-preparation-recipe.request'
import { SearchPreparationRecipesRequest } from '../dto/search-preparation-recipes.request'
import { PreparationRecipeDetailResponse } from '@contexts/kitchen/transformation/application/dto/preparation-recipe-detail.response'
import { CreatePreparationRecipe } from '@contexts/kitchen/transformation/application/create/create-preparation-recipe'
import { SearchPreparationRecipesByCriteria } from '@contexts/kitchen/transformation/application/search-by-criteria/search-preparation-recipes-by-criteria'
import { UpdatePreparationRecipe } from '@contexts/kitchen/transformation/application/update/update-preparation-recipe'
import { FindPreparationRecipeDetail } from '@contexts/kitchen/transformation/application/find/find-preparation-recipe-detail'
import { PaginatedPreparationRecipeListResponse } from '@contexts/kitchen/transformation/application/dto/paginated-preparation-recipe-list.response'
import { PreparationRecipeListItemResponse } from '@contexts/kitchen/transformation/application/dto/preparation-recipe-list-item.response'

@Controller('preparation-recipes')
export class PreparationRecipeController {
  constructor(
    private readonly createPreparationRecipe: CreatePreparationRecipe,
    private readonly searchPreparationRecipesByCriteria: SearchPreparationRecipesByCriteria,
    private readonly updatePreparationRecipe: UpdatePreparationRecipe,
    private readonly findPreparationRecipeDetail: FindPreparationRecipeDetail
  ) {}

  @Post()
  async create(@Body() dto: CreatePreparationRecipeRequest): Promise<void> {
    await this.createPreparationRecipe.run(
      dto.id,
      dto.name,
      dto.baseIngredientId,
      dto.outputIngredientId,
      dto.yieldPercentage,
      dto.additionalIngredients.map(item => ({
        id: item.id,
        ingredientId: item.ingredientId,
        quantityPerUnit: item.quantityPerUnit
      })),
      dto.description ?? null,
      dto.yieldTolerancePercentage ?? null
    )
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePreparationRecipeRequest
  ): Promise<void> {
    await this.updatePreparationRecipe.run(
      id,
      dto.name,
      dto.description ?? null,
      dto.yieldPercentage,
      dto.yieldTolerancePercentage ?? 5,
      dto.additionalIngredients.map(item => ({
        id: item.id,
        ingredientId: item.ingredientId,
        quantityPerUnit: item.quantityPerUnit
      }))
    )
  }

  @Get()
  async search(
    @Query() dto: SearchPreparationRecipesRequest
  ): Promise<PaginatedPreparationRecipeListResponse> {
    const result = await this.searchPreparationRecipesByCriteria.run(dto.toCriteria())
    const data = result.data.map(item => PreparationRecipeListItemResponse.fromReadModel(item))
    return new PaginatedPreparationRecipeListResponse(data, result.meta)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PreparationRecipeDetailResponse> {
    const detail = await this.findPreparationRecipeDetail.run(id)
    return PreparationRecipeDetailResponse.fromReadModel(detail)
  }
}

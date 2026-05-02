import { Controller, Post, Get, Body, Query } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreatePreparationRecipeRequest } from '../dto/create-preparation-recipe.request'
import { SearchPreparationRecipesRequest } from '../dto/search-preparation-recipes.request'
import { CreatePreparationRecipeCommand } from '@contexts/kitchen/transformation/application/create/create-preparation-recipe.command'
import { SearchPreparationRecipesByCriteriaQuery } from '@contexts/kitchen/transformation/application/search-by-criteria/search-preparation-recipes-by-criteria.query'
import { PaginatedPreparationRecipeListResponse } from '@contexts/kitchen/transformation/application/dto/paginated-preparation-recipe-list.response'

@Controller('preparation-recipes')
export class PreparationRecipeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

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

  @Get()
  async search(
    @Query() dto: SearchPreparationRecipesRequest
  ): Promise<PaginatedPreparationRecipeListResponse> {
    return this.queryBus.execute(new SearchPreparationRecipesByCriteriaQuery(dto.toCriteria()))
  }
}

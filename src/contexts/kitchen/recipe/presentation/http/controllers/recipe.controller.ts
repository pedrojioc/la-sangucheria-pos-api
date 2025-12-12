import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateRecipeRequest } from '../dto/create-recipe.request'
import { UpdateRecipeRequest } from '../dto/update-recipe.request'
import { RecipeResponse } from '../dto/recipe.response'
import { CreateRecipeCommand } from '@contexts/kitchen/recipe/application/create/create-recipe.command'
import { FindRecipeQuery } from '@contexts/kitchen/recipe/application/find/find-recipe.query'
import { SearchAllRecipesQuery } from '@contexts/kitchen/recipe/application/search-all/search-all-recipes.query'
import { UpdateRecipeCommand } from '@contexts/kitchen/recipe/application/update/update-recipe.command'
import { DeleteRecipeCommand } from '@contexts/kitchen/recipe/application/delete/delete-recipe.command'
import { Recipe } from '@contexts/kitchen/recipe/domain/recipe'

@Controller('recipes')
export class RecipeController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRecipeRequest): Promise<void> {
    const command = new CreateRecipeCommand(
      dto.id,
      dto.name,
      dto.items,
      dto.recipeYield,
      dto.description
    )

    await this.commandBus.execute(command)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RecipeResponse> {
    const query = new FindRecipeQuery(id)
    const recipe: Recipe = await this.queryBus.execute(query)
    return RecipeResponse.fromDomain(recipe)
  }

  @Get()
  async findAll(): Promise<RecipeResponse[]> {
    const query = new SearchAllRecipesQuery()
    const recipes: Recipe[] = await this.queryBus.execute(query)
    return recipes.map(recipe => RecipeResponse.fromDomain(recipe))
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Param('id') id: string, @Body() dto: UpdateRecipeRequest): Promise<void> {
    const command = new UpdateRecipeCommand(
      id,
      dto.name,
      dto.items,
      dto.recipeYield,
      dto.description
    )

    await this.commandBus.execute(command)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteRecipeCommand(id)
    await this.commandBus.execute(command)
  }
}

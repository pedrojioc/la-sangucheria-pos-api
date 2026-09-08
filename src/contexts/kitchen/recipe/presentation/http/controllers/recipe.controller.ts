import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { CreateRecipeRequest } from '../dto/create-recipe.request'
import { UpdateRecipeRequest } from '../dto/update-recipe.request'
import { RecipeResponse } from '@contexts/kitchen/recipe/application/dto/recipe.response'
import { CreateRecipe } from '@contexts/kitchen/recipe/application/create/create-recipe'
import { FindRecipe } from '@contexts/kitchen/recipe/application/find/find-recipe'
import { SearchAllRecipes } from '@contexts/kitchen/recipe/application/search-all/search-all-recipes'
import { UpdateRecipe } from '@contexts/kitchen/recipe/application/update/update-recipe'
import { DeleteRecipe } from '@contexts/kitchen/recipe/application/delete/delete-recipe'

@Controller('recipes')
export class RecipeController {
  constructor(
    private readonly createRecipe: CreateRecipe,
    private readonly updateRecipe: UpdateRecipe,
    private readonly deleteRecipe: DeleteRecipe,
    private readonly findRecipe: FindRecipe,
    private readonly searchAllRecipes: SearchAllRecipes
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateRecipeRequest): Promise<void> {
    await this.createRecipe.run(dto.id, dto.name, dto.items, dto.recipeYield, dto.description)
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<RecipeResponse> {
    return RecipeResponse.fromDomain(await this.findRecipe.run(id))
  }

  @Get()
  async findAll(): Promise<RecipeResponse[]> {
    return (await this.searchAllRecipes.run()).map(recipe => RecipeResponse.fromDomain(recipe))
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Param('id') id: string, @Body() dto: UpdateRecipeRequest): Promise<void> {
    await this.updateRecipe.run(id, dto.name, dto.items, dto.recipeYield, dto.description)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteRecipe.run(id)
  }
}

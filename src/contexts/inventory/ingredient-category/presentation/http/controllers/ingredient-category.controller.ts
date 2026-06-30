import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { CreateIngredientCategoryDto } from '../dto/create-ingredient-category.dto'
import { UpdateIngredientCategoryDto } from '../dto/update-ingredient-category.dto'
import { CreateIngredientCategoryCommand } from '@contexts/inventory/ingredient-category/application/create/create-ingredient-category.command'
import { UpdateIngredientCategoryCommand } from '@contexts/inventory/ingredient-category/application/update/update-ingredient-category.command'
import { FindIngredientCategoryQuery } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category.query'
import { IngredientCategoryResponse } from '@contexts/inventory/ingredient-category/application/dto/ingredient-category.response'
import { SearchIngredientCategoriesRequest } from '../dto/search-ingredient-categories.request'
import { SearchIngredientCategoriesByCriteriaQuery } from '@contexts/inventory/ingredient-category/application/search-by-criteria/search-ingredient-categories-by-criteria.query'
import { PaginatedIngredientCategoryListResponse } from '@contexts/inventory/ingredient-category/application/dto/paginated-ingredient-category-list.response'

@Controller('ingredient-categories')
export class IngredientCategoryController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateIngredientCategoryDto) {
    const command = new CreateIngredientCategoryCommand(
      dto.id,
      dto.name,
      dto.description || null,
      dto.icon || null,
      dto.color || null,
      dto.sortOrden ?? 0,
      dto.isActive
    )

    await this.commandBus.execute(command)
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateIngredientCategoryDto) {
    const command = new UpdateIngredientCategoryCommand(
      id,
      dto.name,
      dto.description ?? null,
      dto.icon ?? null,
      dto.color ?? null,
      dto.sortOrder ?? 0,
      dto.isActive
    )

    await this.commandBus.execute(command)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<IngredientCategoryResponse> {
    const query = new FindIngredientCategoryQuery(id)
    return this.queryBus.execute(query)
  }

  @Get()
  async search(
    @Query() dto: SearchIngredientCategoriesRequest
  ): Promise<PaginatedIngredientCategoryListResponse> {
    const criteria = dto.toCriteria()
    const query = new SearchIngredientCategoriesByCriteriaQuery(criteria)
    return this.queryBus.execute(query)
  }
}

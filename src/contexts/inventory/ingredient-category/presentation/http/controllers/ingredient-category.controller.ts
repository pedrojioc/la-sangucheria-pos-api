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

import { CreateIngredientCategoryDto } from '../dto/create-ingredient-category.dto'
import { UpdateIngredientCategoryDto } from '../dto/update-ingredient-category.dto'
import { CreateIngredientCategory } from '@contexts/inventory/ingredient-category/application/create/create-ingredient-category'
import { UpdateIngredientCategory } from '@contexts/inventory/ingredient-category/application/update/update-ingredient-category'
import { FindIngredientCategory } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category'
import { IngredientCategoryResponse } from '@contexts/inventory/ingredient-category/application/dto/ingredient-category.response'
import { SearchIngredientCategoriesRequest } from '../dto/search-ingredient-categories.request'
import { SearchIngredientCategoriesByCriteria } from '@contexts/inventory/ingredient-category/application/search-by-criteria/search-ingredient-categories-by-criteria'
import { PaginatedIngredientCategoryListResponse } from '@contexts/inventory/ingredient-category/application/dto/paginated-ingredient-category-list.response'
import { IngredientCategoryListItemResponse } from '@contexts/inventory/ingredient-category/application/dto/ingredient-category-list-item.response'

@Controller('ingredient-categories')
export class IngredientCategoryController {
  constructor(
    private readonly createIngredientCategory: CreateIngredientCategory,
    private readonly updateIngredientCategory: UpdateIngredientCategory,
    private readonly findIngredientCategory: FindIngredientCategory,
    private readonly searchIngredientCategoriesByCriteria: SearchIngredientCategoriesByCriteria
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateIngredientCategoryDto) {
    await this.createIngredientCategory.run(
      dto.id,
      dto.name,
      dto.description || null,
      dto.icon || null,
      dto.color || null,
      dto.sortOrden ?? 0,
      dto.isActive
    )
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateIngredientCategoryDto) {
    await this.updateIngredientCategory.run(
      id,
      dto.name,
      dto.description ?? null,
      dto.icon ?? null,
      dto.color ?? null,
      dto.sortOrder ?? 0,
      dto.isActive
    )
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<IngredientCategoryResponse> {
    return IngredientCategoryResponse.fromDomain(await this.findIngredientCategory.run(id))
  }

  @Get()
  async search(
    @Query() dto: SearchIngredientCategoriesRequest
  ): Promise<PaginatedIngredientCategoryListResponse> {
    const result = await this.searchIngredientCategoriesByCriteria.run(dto.toCriteria())
    const data = result.data.map(item => IngredientCategoryListItemResponse.fromReadModel(item))
    return new PaginatedIngredientCategoryListResponse(data, result.meta)
  }
}

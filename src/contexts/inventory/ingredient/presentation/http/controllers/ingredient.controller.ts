import { Body, Controller, Get, Param, Post, Put, Query, UseInterceptors } from '@nestjs/common'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'

import { CreateIngredientDto } from '../dto/create-ingredient.dto'
import { UpdateIngredientDto } from '../dto/update-ingredient.dto'
import { SearchIngredientsRequest } from '../dto/search-ingredients.request'
import { CreateIngredient } from '@contexts/inventory/ingredient/application/create/create-ingredient'
import { UpdateIngredient } from '@contexts/inventory/ingredient/application/update/update-ingredient'
import { FindIngredient } from '@contexts/inventory/ingredient/application/find/find-ingredient'
import { SearchIngredientsByCriteria } from '@contexts/inventory/ingredient/application/search-by-criteria/search-ingredients-by-criteria'
import { IngredientResponse } from '@contexts/inventory/ingredient/application/dto/ingredient.response'
import { PaginatedIngredientListResponse } from '@contexts/inventory/ingredient/application/dto/paginated-ingredient-list.response'
import { IngredientListItemResponse } from '@contexts/inventory/ingredient/application/dto/ingredient-list-item.response'

@Controller('ingredients')
export class IngredientController {
  constructor(
    private readonly createIngredient: CreateIngredient,
    private readonly updateIngredient: UpdateIngredient,
    private readonly findIngredient: FindIngredient,
    private readonly searchIngredientsByCriteria: SearchIngredientsByCriteria
  ) {}

  @Post()
  @UseInterceptors(TransactionInterceptor)
  async create(@Body() dto: CreateIngredientDto) {
    await this.createIngredient.run(
      dto.id,
      dto.name,
      dto.description || null,
      dto.ingredientCategoryId,
      dto.unitId,
      dto.preferredSupplierId || null,
      dto.minimumStock ?? null,
      dto.maximumStock ?? null,
      dto.isPerishable,
      dto.shelfLifeDays ?? null,
      dto.storageLocation || null,
      dto.isActive
    )
  }

  @Get()
  async search(@Query() dto: SearchIngredientsRequest): Promise<PaginatedIngredientListResponse> {
    const result = await this.searchIngredientsByCriteria.run(dto.toCriteria())
    const data = result.data.map(item => IngredientListItemResponse.fromReadModel(item))
    return new PaginatedIngredientListResponse(data, result.meta)
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateIngredientDto): Promise<void> {
    await this.updateIngredient.run(
      id,
      dto.name,
      dto.description || null,
      dto.ingredientCategoryId,
      dto.unitId,
      dto.preferredSupplierId || null,
      dto.minimumStock ?? null,
      dto.maximumStock ?? null,
      dto.isPerishable,
      dto.shelfLifeDays ?? null,
      dto.storageLocation || null,
      dto.isActive
    )
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<IngredientResponse> {
    return IngredientResponse.fromDomain(await this.findIngredient.run(id))
  }
}

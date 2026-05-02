import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { CreateIngredientDto } from '../dto/create-ingredient.dto'
import { SearchIngredientsRequest } from '../dto/search-ingredients.request'
import { CreateIngredientCommand } from '@contexts/inventory/ingredient/application/create/create-ingredient.command'
import { FindIngredientQuery } from '@contexts/inventory/ingredient/application/find/find-ingredient.query'
import { SearchIngredientsByCriteriaQuery } from '@contexts/inventory/ingredient/application/search-by-criteria/search-ingredients-by-criteria.query'
import { IngredientResponse } from '@contexts/inventory/ingredient/application/dto/ingredient.response'
import { PaginatedIngredientListResponse } from '@contexts/inventory/ingredient/application/dto/paginated-ingredient-list.response'

@Controller('ingredients')
export class IngredientController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  async create(@Body() dto: CreateIngredientDto) {
    const command = new CreateIngredientCommand(
      dto.id,
      dto.name,
      dto.description || null,
      dto.ingredientCategoryId,
      dto.unitId,
      dto.preferredSupplierId || null,
      dto.minimumStock || null,
      dto.maximumStock || null,
      dto.isPerishable,
      dto.shelfLifeDays || null,
      dto.storageLocation || null,
      dto.isActive
    )

    await this.commandBus.execute(command)
  }

  @Get()
  async search(@Query() dto: SearchIngredientsRequest): Promise<PaginatedIngredientListResponse> {
    return this.queryBus.execute(new SearchIngredientsByCriteriaQuery(dto.toCriteria()))
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<IngredientResponse> {
    return this.queryBus.execute(new FindIngredientQuery(id))
  }
}

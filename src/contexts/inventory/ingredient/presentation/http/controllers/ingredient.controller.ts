import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { CreateIngredientDto } from '../dto/create-ingredient.dto'
import { SearchIngredientsRequest } from '../dto/search-ingredients.request'
import { CreateIngredientCommand } from '@contexts/inventory/ingredient/application/create/create-ingredient.command'
import { FindIngredientQuery } from '@contexts/inventory/ingredient/application/find/find-ingredient.query'
import { IngredientResponse } from '@contexts/inventory/ingredient/application/dto/ingredient.response'
import { IngredientQueryService } from '@contexts/inventory/ingredient/application/services/ingredient-query.service'

@Controller('ingredients')
export class IngredientController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly ingredientQueryService: IngredientQueryService
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
  async search(@Query() dto: SearchIngredientsRequest) {
    const criteria = dto.toCriteria()
    return this.ingredientQueryService.searchWithDetails(criteria)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<IngredientResponse> {
    const query = new FindIngredientQuery(id)
    return this.queryBus.execute(query)
  }
}

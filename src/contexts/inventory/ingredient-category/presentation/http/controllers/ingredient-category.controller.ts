import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { CreateIngredientCategoryDto } from '../dto/create-ingredient-category.dto'
import { CreateIngredientCategoryCommand } from '@contexts/inventory/ingredient-category/application/create/create-ingredient-category.command'
import { FindIngredientCategoryQuery } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category.query'
import { IngredientCategoryResponse } from '@contexts/inventory/ingredient-category/application/dto/ingredient-category.response'
import { IngredientCategoryListResponse } from '@contexts/inventory/ingredient-category/application/dto/ingredient-category-list.response'
import { FindAllIngredientCategoryQuery } from '@contexts/inventory/ingredient-category/application/find-all/find-all-ingredient-category.query'

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
      dto.sortOrden || null,
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
  async findAll(): Promise<IngredientCategoryListResponse> {
    const query = new FindAllIngredientCategoryQuery()
    return this.queryBus.execute(query)
  }
}

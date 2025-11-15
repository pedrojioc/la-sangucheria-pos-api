import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put
} from '@nestjs/common'
import { CommandBus, QueryBus } from '@nestjs/cqrs'

import { CreateProductCategoryRequest } from '../dto/create-product-category.request'
import { UpdateProductCategoryRequest } from '../dto/update-product-category.request'
import { CreateProductCategoryCommand } from '@contexts/menu/product-category/application/create/create-product-category.command'
import { UpdateProductCategoryCommand } from '@contexts/menu/product-category/application/update/update-product-category.command'
import { DeleteProductCategoryCommand } from '@contexts/menu/product-category/application/delete/delete-product-category.command'
import { FindProductCategoryQuery } from '@contexts/menu/product-category/application/find/find-product-category.query'
import { FindAllProductCategoriesQuery } from '@contexts/menu/product-category/application/find-all/find-all-product-categories.query'
import { ProductCategoryResponse } from '@contexts/menu/product-category/application/dto/product-category.response'
import { ProductCategoryListResponse } from '@contexts/menu/product-category/application/dto/product-category-list.response'

@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductCategoryRequest): Promise<void> {
    const command = new CreateProductCategoryCommand(
      dto.id,
      dto.name,
      dto.description,
      dto.icon,
      dto.isActive,
      dto.displayOrder
    )

    await this.commandBus.execute(command)
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateProductCategoryRequest): Promise<void> {
    const command = new UpdateProductCategoryCommand(
      id,
      dto.name,
      dto.description,
      dto.icon,
      dto.isActive,
      dto.displayOrder
    )

    await this.commandBus.execute(command)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteProductCategoryCommand(id)

    await this.commandBus.execute(command)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductCategoryResponse> {
    const query = new FindProductCategoryQuery(id)
    return this.queryBus.execute(query)
  }

  @Get()
  async findAll(): Promise<ProductCategoryListResponse> {
    const query = new FindAllProductCategoriesQuery()
    return this.queryBus.execute(query)
  }
}

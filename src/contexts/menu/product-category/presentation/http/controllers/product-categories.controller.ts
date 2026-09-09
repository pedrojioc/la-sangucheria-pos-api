import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query
} from '@nestjs/common'
import { CreateProductCategoryRequest } from '../dto/create-product-category.request'
import { UpdateProductCategoryRequest } from '../dto/update-product-category.request'
import { SearchProductCategoriesRequest } from '../dto/search-product-categories.request'
import { CreateProductCategory } from '@contexts/menu/product-category/application/create/create-product-category'
import { UpdateProductCategory } from '@contexts/menu/product-category/application/update/update-product-category'
import { DeleteProductCategory } from '@contexts/menu/product-category/application/delete/delete-product-category'
import { FindProductCategory } from '@contexts/menu/product-category/application/find/find-product-category'
import { SearchProductCategoriesByCriteria } from '@contexts/menu/product-category/application/search-by-criteria/search-product-categories-by-criteria'
import { ProductCategoryResponse } from '@contexts/menu/product-category/application/dto/product-category.response'
import { ProductCategoryListItemResponse } from '@contexts/menu/product-category/application/dto/product-category-list-item.response'
import { PaginatedProductCategoryListResponse } from '@contexts/menu/product-category/application/dto/paginated-product-category-list.response'

@Controller('product-categories')
export class ProductCategoriesController {
  constructor(
    private readonly createProductCategory: CreateProductCategory,
    private readonly updateProductCategory: UpdateProductCategory,
    private readonly deleteProductCategory: DeleteProductCategory,
    private readonly findProductCategory: FindProductCategory,
    private readonly searchProductCategoriesByCriteria: SearchProductCategoriesByCriteria
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductCategoryRequest): Promise<void> {
    await this.createProductCategory.run(
      dto.id,
      dto.name,
      dto.description,
      dto.icon,
      dto.color,
      dto.isActive,
      dto.displayOrder ?? 0,
      dto.defaultStationId ?? null
    )
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(@Param('id') id: string, @Body() dto: UpdateProductCategoryRequest): Promise<void> {
    await this.updateProductCategory.run(
      id,
      dto.name,
      dto.description,
      dto.icon,
      dto.color,
      dto.isActive,
      dto.displayOrder ?? 0,
      dto.defaultStationId ?? null
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteProductCategory.run(id)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductCategoryResponse> {
    return ProductCategoryResponse.fromDomain(await this.findProductCategory.run(id))
  }

  @Get()
  async search(
    @Query() request: SearchProductCategoriesRequest
  ): Promise<PaginatedProductCategoryListResponse> {
    const result = await this.searchProductCategoriesByCriteria.run(request.toCriteria())
    const data = result.data.map(item => ProductCategoryListItemResponse.fromReadModel(item))
    return new PaginatedProductCategoryListResponse(data, result.meta)
  }
}

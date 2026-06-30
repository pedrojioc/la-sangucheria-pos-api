import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

import { CommandBus, QueryBus } from '@nestjs/cqrs'
import { CreateProductRequest } from '../dto/create-product.request'
import { UpdateProductRequest } from '../dto/update-product.request'
import { SearchProductsRequest } from '../dto/search-products.request'
import { CreateProductCommand } from '@contexts/menu/product/application/create/create-product.command'
import { UpdateProductCommand } from '@contexts/menu/product/application/update/update-product.command'
import { DeleteProductCommand } from '@contexts/menu/product/application/delete/delete-product.command'
import { SearchProductsByCriteriaQuery } from '@contexts/menu/product/application/search-by-criteria/search-products-by-criteria.query'
import { PaginatedProductListResponse } from '@contexts/menu/product/application/dto/paginated-product-list.response'
import { FindProductWithOptionsQuery } from '@contexts/menu/product-option/application/find-product-with-options/find-product-with-options.query'
import { ProductWithOptionsResponse } from '@contexts/menu/product-option/application/dto/product-with-options.response'
import { FileAdapter } from '@/shared/presentation/dto/file-adapter'
import { GenerateProductSkuQuery } from '@contexts/menu/product/application/generate-sku/generate-product-sku.query'
import { GenerateProductSkuResponse } from '../dto/generate-product-sku.response'

@Controller('products')
export class ProductController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imageFile'))
  async create(
    @Body() dto: CreateProductRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|avif)$/ })
        ],
        fileIsRequired: false
      })
    )
    file?: Express.Multer.File
  ): Promise<void> {
    const command = new CreateProductCommand(
      dto.id,
      dto.name,
      dto.categoryId,
      dto.price,
      dto.sku,
      dto.inventoryStrategyType ?? null,
      dto.description,
      dto.ingredientId,
      file ? FileAdapter.fromExpressFile(file) : null,
      dto.preparationTime,
      dto.displayOrder,
      dto.tags
    )

    await this.commandBus.execute(command)
  }

  @Get('generate-sku')
  async generateSku(): Promise<GenerateProductSkuResponse> {
    const query = new GenerateProductSkuQuery()
    const sku = await this.queryBus.execute<GenerateProductSkuQuery, string>(query)
    return GenerateProductSkuResponse.create(sku)
  }

  @Get()
  async search(@Query() dto: SearchProductsRequest): Promise<PaginatedProductListResponse> {
    const criteria = dto.toCriteria()
    const query = new SearchProductsByCriteriaQuery(criteria)
    return this.queryBus.execute(query)
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductWithOptionsResponse> {
    const query = new FindProductWithOptionsQuery(id)
    return this.queryBus.execute(query)
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp|avif)$/ })
        ],
        fileIsRequired: false
      })
    )
    file?: Express.Multer.File
  ): Promise<void> {
    const command = new UpdateProductCommand(
      id,
      dto.name,
      dto.categoryId,
      dto.price,
      dto.inventoryStrategyType ?? null,
      dto.description,
      dto.ingredientId,
      file ? FileAdapter.fromExpressFile(file) : null,
      dto.removeImage,
      dto.preparationTime,
      dto.displayOrder,
      dto.tags
    )

    await this.commandBus.execute(command)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    const command = new DeleteProductCommand(id)
    await this.commandBus.execute(command)
  }
}

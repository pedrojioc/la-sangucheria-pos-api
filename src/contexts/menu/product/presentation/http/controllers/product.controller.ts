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

import { CreateProductRequest } from '../dto/create-product.request'
import { UpdateProductRequest } from '../dto/update-product.request'
import { SearchProductsRequest } from '../dto/search-products.request'
import { CreateProduct } from '@contexts/menu/product/application/create/create-product'
import { UpdateProduct } from '@contexts/menu/product/application/update/update-product'
import { DeleteProduct } from '@contexts/menu/product/application/delete/delete-product'
import { SearchProductsByCriteria } from '@contexts/menu/product/application/search-by-criteria/search-products-by-criteria'
import { ProductListItemResponse } from '@contexts/menu/product/application/dto/product-list-item.response'
import { PaginatedProductListResponse } from '@contexts/menu/product/application/dto/paginated-product-list.response'
import { FileAdapter } from '@/shared/presentation/dto/file-adapter'
import { GenerateProductSku } from '@contexts/menu/product/application/generate-sku/generate-product-sku'
import { GenerateProductSkuResponse } from '@contexts/menu/product/application/dto/generate-product-sku.response'

@Controller('products')
export class ProductController {
  constructor(
    private readonly createProduct: CreateProduct,
    private readonly updateProduct: UpdateProduct,
    private readonly deleteProduct: DeleteProduct,
    private readonly searchProductsByCriteria: SearchProductsByCriteria,
    private readonly generateProductSku: GenerateProductSku
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
    await this.createProduct.run(
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
  }

  @Get('generate-sku')
  async generateSku(): Promise<GenerateProductSkuResponse> {
    return GenerateProductSkuResponse.create(await this.generateProductSku.run())
  }

  @Get()
  async search(@Query() dto: SearchProductsRequest): Promise<PaginatedProductListResponse> {
    const result = await this.searchProductsByCriteria.run(dto.toCriteria())
    const data = result.data.map(item => ProductListItemResponse.fromReadModel(item))
    return new PaginatedProductListResponse(data, result.meta)
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
    await this.updateProduct.run(
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
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteProduct.run(id)
  }
}

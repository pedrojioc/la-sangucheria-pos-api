import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseInterceptors
} from '@nestjs/common'
import { TransactionInterceptor } from '@shared/infrastructure/unit-of-work/transaction.interceptor'
import { SaveProductRecipe } from '@contexts/menu/product-recipe/application/save/save-product-recipe'
import { FindProductRecipe } from '@contexts/menu/product-recipe/application/find/find-product-recipe'
import { ProductRecipeResponse } from '@contexts/menu/product-recipe/application/dto/product-recipe.response'
import { SaveProductRecipeRequest } from '../dto/save-product-recipe.request'

@Controller('products/:productId/recipe')
export class ProductRecipeController {
  constructor(
    private readonly saveProductRecipe: SaveProductRecipe,
    private readonly findProductRecipe: FindProductRecipe
  ) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(TransactionInterceptor)
  async save(
    @Param('productId') productId: string,
    @Body() dto: SaveProductRecipeRequest
  ): Promise<void> {
    await this.saveProductRecipe.run(dto.id, productId, dto.items)
  }

  @Get()
  async find(@Param('productId') productId: string): Promise<ProductRecipeResponse> {
    const recipe = await this.findProductRecipe.run(productId)
    return ProductRecipeResponse.fromDomain(recipe)
  }
}

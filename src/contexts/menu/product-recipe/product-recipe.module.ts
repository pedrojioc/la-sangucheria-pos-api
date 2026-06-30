import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventBus } from '@shared/domain/events'
import { createProvider } from '@core/utils/create-provider'

import { ProductRecipeEntity } from './infrastructure/persistence/typeorm/product-recipe.entity'
import { ProductRecipeItemEntity } from './infrastructure/persistence/typeorm/product-recipe-item.entity'
import { TypeOrmProductRecipeRepository } from './infrastructure/persistence/typeorm/typeorm-product-recipe.repository'
import { ProductRecipeRepository } from './domain/repositories/product-recipe.repository'
import { SaveProductRecipe } from './application/save/save-product-recipe'
import { FindProductRecipe } from './application/find/find-product-recipe'
import { ProductRecipeController } from './presentation/http/controllers/product-recipe.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ProductRecipeEntity, ProductRecipeItemEntity])],
  controllers: [ProductRecipeController],
  providers: [
    { provide: ProductRecipeRepository, useClass: TypeOrmProductRecipeRepository },
    createProvider(SaveProductRecipe, [ProductRecipeRepository, EventBus]),
    createProvider(FindProductRecipe, [ProductRecipeRepository])
  ],
  exports: [ProductRecipeRepository, FindProductRecipe]
})
export class ProductRecipeModule {}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'
import { DataSource } from 'typeorm'
import { EventBus } from '@/shared/domain/events'
import { createProvider } from '@/core/utils/create-provider'

import { PreparationRecipeEntity } from './infrastructure/persistence/typeorm/preparation-recipe.entity'
import { PreparationRecipeIngredientEntity } from './infrastructure/persistence/typeorm/preparation-recipe-ingredient.entity'
import { PreparationRecipeRepository } from './domain/repositories/preparation-recipe.repository'
import { TypeOrmPreparationRecipeRepository } from './infrastructure/persistence/typeorm/typeorm-preparation-recipe.repository'
import { PreparationRecipeQueryService } from './application/services/preparation-recipe-query.service'
import { TypeOrmPreparationRecipeQueryService } from './infrastructure/query-services/typeorm-preparation-recipe-query.service'

import { IngredientTransformationEntity } from './infrastructure/persistence/typeorm/ingredient-transformation.entity'
import { IngredientTransformationRepository } from './domain/repositories/ingredient-transformation.repository'
import { TypeOrmIngredientTransformationRepository } from './infrastructure/persistence/typeorm/typeorm-ingredient-transformation.repository'
import { TransformationUnitOfWork } from './domain/transformation-unit-of-work'
import { TypeOrmTransformationUnitOfWork } from './infrastructure/persistence/typeorm/typeorm-transformation-unit-of-work'

import { IngredientModule } from '@contexts/inventory/ingredient/ingredient.module'
import { FindIngredient } from '@contexts/inventory/ingredient/application/find/find-ingredient'
import { StockLevelModule } from '@contexts/inventory/stock-level/stock-level.module'
import { GetIngredientFifoCost } from '@contexts/inventory/stock-level/application/get-ingredient-fifo-cost/get-ingredient-fifo-cost'
import { FifoInventoryService } from '@contexts/inventory/batch/domain/services/fifo-inventory.service'

import { CreatePreparationRecipe } from './application/create/create-preparation-recipe'
import { UpdatePreparationRecipe } from './application/update/update-preparation-recipe'
import { FindPreparationRecipe } from './application/find/find-preparation-recipe'
import { FindPreparationRecipeDetail } from './application/find/find-preparation-recipe-detail'
import { SearchPreparationRecipesByCriteria } from './application/search-by-criteria/search-preparation-recipes-by-criteria'
import { RegisterTransformation } from './application/register/register-transformation'

import { CreatePreparationRecipeHandler } from './application/create/create-preparation-recipe.handler'
import { SearchPreparationRecipesByCriteriaHandler } from './application/search-by-criteria/search-preparation-recipes-by-criteria.handler'
import { RegisterTransformationHandler } from './application/register/register-transformation.handler'

import { PreparationRecipeController } from './presentation/http/controllers/preparation-recipe.controller'
import { IngredientTransformationController } from './presentation/http/controllers/ingredient-transformation.controller'

const CommandHandlers = [CreatePreparationRecipeHandler, RegisterTransformationHandler]
const QueryHandlers = [SearchPreparationRecipesByCriteriaHandler]

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      PreparationRecipeEntity,
      PreparationRecipeIngredientEntity,
      IngredientTransformationEntity
    ]),
    IngredientModule,
    StockLevelModule
  ],
  controllers: [PreparationRecipeController, IngredientTransformationController],
  providers: [
    { provide: PreparationRecipeRepository, useClass: TypeOrmPreparationRecipeRepository },
    { provide: PreparationRecipeQueryService, useClass: TypeOrmPreparationRecipeQueryService },
    {
      provide: IngredientTransformationRepository,
      useClass: TypeOrmIngredientTransformationRepository
    },
    {
      provide: TransformationUnitOfWork,
      useFactory: (dataSource: DataSource) => new TypeOrmTransformationUnitOfWork(dataSource),
      inject: [DataSource]
    },

    createProvider(CreatePreparationRecipe, [
      PreparationRecipeRepository,
      EventBus,
      FindIngredient
    ]),
    createProvider(UpdatePreparationRecipe, [PreparationRecipeRepository, FindIngredient]),
    createProvider(FindPreparationRecipe, [PreparationRecipeRepository]),
    createProvider(FindPreparationRecipeDetail, [PreparationRecipeQueryService]),
    createProvider(SearchPreparationRecipesByCriteria, [PreparationRecipeQueryService]),
    { provide: FifoInventoryService, useClass: FifoInventoryService },

    createProvider(RegisterTransformation, [
      FindPreparationRecipe,
      FindIngredient,
      GetIngredientFifoCost,
      FifoInventoryService,
      TransformationUnitOfWork,
      EventBus
    ]),

    ...CommandHandlers,
    ...QueryHandlers
  ]
})
export class TransformationModule {}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'
import { EventBus } from '@/shared/domain/events'
import { createProvider } from '@/core/utils/create-provider'

import { PreparationRecipeEntity } from './infrastructure/persistence/typeorm/preparation-recipe.entity'
import { PreparationRecipeRepository } from './domain/repositories/preparation-recipe.repository'
import { TypeOrmPreparationRecipeRepository } from './infrastructure/persistence/typeorm/typeorm-preparation-recipe.repository'
import { PreparationRecipeQueryService } from './application/services/preparation-recipe-query.service'
import { TypeOrmPreparationRecipeQueryService } from './infrastructure/query-services/typeorm-preparation-recipe-query.service'

import { CreatePreparationRecipe } from './application/create/create-preparation-recipe'
import { SearchPreparationRecipesByCriteria } from './application/search-by-criteria/search-preparation-recipes-by-criteria'

import { CreatePreparationRecipeHandler } from './application/create/create-preparation-recipe.handler'
import { SearchPreparationRecipesByCriteriaHandler } from './application/search-by-criteria/search-preparation-recipes-by-criteria.handler'

import { PreparationRecipeController } from './presentation/http/controllers/preparation-recipe.controller'
import { IngredientTransformationController } from './presentation/http/controllers/ingredient-transformation.controller'

const CommandHandlers = [CreatePreparationRecipeHandler]
const QueryHandlers = [SearchPreparationRecipesByCriteriaHandler]

@Module({
  imports: [CqrsModule, TypeOrmModule.forFeature([PreparationRecipeEntity])],
  controllers: [PreparationRecipeController, IngredientTransformationController],
  providers: [
    { provide: PreparationRecipeRepository, useClass: TypeOrmPreparationRecipeRepository },
    { provide: PreparationRecipeQueryService, useClass: TypeOrmPreparationRecipeQueryService },

    createProvider(CreatePreparationRecipe, [PreparationRecipeRepository, EventBus]),
    createProvider(SearchPreparationRecipesByCriteria, [PreparationRecipeQueryService]),

    ...CommandHandlers,
    ...QueryHandlers
  ]
})
export class TransformationModule {}

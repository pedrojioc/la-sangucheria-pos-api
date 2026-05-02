import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { IngredientEntity } from './infrastructure/persistence/typeorm/ingredient.entity'
import { IngredientRepository } from './domain/repositories/ingredient.repository'
import { TypeOrmIngredientRepository } from './infrastructure/persistence/typeorm/typeorm-ingredient.repository'
import { IngredientQueryService } from './application/services/ingredient-query.service'
import { TypeormIngredientQueryService } from './infrastructure/query-services/typeorm-ingredient-query.service'
import { EventBus } from '@/shared/domain/events'

import { CreateIngredientCommandHandler } from './application/create/create-ingredient.handler'
import { FindIngredientHandler } from './application/find/find-ingredient.handler'
import { FindAllIngredientHandler } from './application/find-all/find-all-ingredient.handler'
import { SearchIngredientsByCriteriaHandler } from './application/search-by-criteria/search-ingredients-by-criteria.handler'

import { CreateIngredient } from './application/create/create-ingredient'
import { FindIngredient } from './application/find/find-ingredient'
import { FindAllIngredients } from './application/find-all/find-all-ingredient'
import { SearchIngredientsByCriteria } from './application/search-by-criteria/search-ingredients-by-criteria'
import { FindIngredientCategory } from '../ingredient-category/application/find/find-ingredient-category'

import { IngredientController } from './presentation/http/controllers/ingredient.controller'
import { createProvider } from '@/core/utils/create-provider'
import { IngredientCategoryModule } from '../ingredient-category/ingredient-category.module'

const CommandHandlers = [CreateIngredientCommandHandler]
const QueryHandlers = [
  FindIngredientHandler,
  FindAllIngredientHandler,
  SearchIngredientsByCriteriaHandler
]

@Module({
  imports: [TypeOrmModule.forFeature([IngredientEntity]), IngredientCategoryModule],
  controllers: [IngredientController],
  providers: [
    { provide: IngredientRepository, useClass: TypeOrmIngredientRepository },
    { provide: IngredientQueryService, useClass: TypeormIngredientQueryService },

    createProvider(CreateIngredient, [IngredientRepository, FindIngredientCategory, EventBus]),
    createProvider(FindIngredient, [IngredientRepository]),
    createProvider(FindAllIngredients, [IngredientRepository]),
    createProvider(SearchIngredientsByCriteria, [IngredientQueryService]),

    ...CommandHandlers,
    ...QueryHandlers
  ],
  exports: [IngredientRepository]
})
export class IngredientModule {}

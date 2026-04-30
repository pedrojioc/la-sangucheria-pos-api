import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { IngredientEntity } from './infrastructure/persistence/typeorm/ingredient.entity'

// Repositories
import { IngredientRepository } from './domain/repositories/ingredient.repository'
import { TypeOrmIngredientRepository } from './infrastructure/persistence/typeorm/typeorm-ingredient.repository'

// Events
import { EventBus } from '@/shared/domain/events'

// Command Handlers
import { CreateIngredientCommandHandler } from './application/create/create-ingredient.handler'

// Query Handlers
import { FindIngredientHandler } from './application/find/find-ingredient.handler'
import { FindAllIngredientHandler } from './application/find-all/find-all-ingredient.handler'
import { SearchIngredientsByCriteriaHandler } from './application/search-by-criteria/search-ingredients-by-criteria.handler'

// Use Cases
import { CreateIngredient } from './application/create/create-ingredient'
import { FindIngredient } from './application/find/find-ingredient'
import { FindAllIngredients } from './application/find-all/find-all-ingredient'
import { SearchIngredientsByCriteria } from './application/search-by-criteria/search-ingredients-by-criteria'
import { FindIngredientCategory } from '../ingredient-category/application/find/find-ingredient-category'

// Controllers
import { IngredientController } from './presentation/http/controllers/ingredient.controller'

// Utils
import { createProvider } from '@/core/utils/create-provider'
import { IngredientCategoryModule } from '../ingredient-category/ingredient-category.module'
import { IngredientQueryService } from './application/services/ingredient-query.service'
import { TypeormIngredientQueryService } from './infrastructure/query-services/typeorm-ingredient-query.service'

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
    // REPOSITORIES
    {
      provide: IngredientRepository,
      useClass: TypeOrmIngredientRepository
    },
    {
      provide: IngredientQueryService,
      useClass: TypeormIngredientQueryService
    },

    // USE CASES
    createProvider(CreateIngredient, [IngredientRepository, FindIngredientCategory, EventBus]),
    createProvider(FindIngredient, [IngredientRepository]),
    createProvider(FindAllIngredients, [IngredientRepository]),
    createProvider(SearchIngredientsByCriteria, [IngredientRepository]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers
  ],
  exports: [IngredientRepository]
})
export class IngredientModule {}

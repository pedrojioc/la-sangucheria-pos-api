import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { IngredientEntity } from './infrastructure/persistence/typeorm/ingredient.entity'

// Repositories
import { IngredientRepository } from './domain/repositories/ingredient.repository'
import { TypeOrmIngredientRepository } from './infrastructure/persistence/typeorm/typeorm-ingredient.repository'
import { IngredientCategoryRepository } from '../ingredient-category/domain/repositories/ingredient-category.repository'

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
import { createUseCaseProvider } from '@/core/utils/createUseCaseProvider'
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
    // REPOSITORIES
    {
      provide: IngredientRepository,
      useClass: TypeOrmIngredientRepository
    },

    // USE CASES
    createUseCaseProvider(CreateIngredient, [
      IngredientRepository,
      FindIngredientCategory,
      EventBus
    ]),
    createUseCaseProvider(FindIngredient, [IngredientRepository]),
    createUseCaseProvider(FindAllIngredients, [IngredientRepository]),
    createUseCaseProvider(SearchIngredientsByCriteria, [IngredientRepository]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers
  ],
  exports: [IngredientRepository]
})
export class IngredientModule {}

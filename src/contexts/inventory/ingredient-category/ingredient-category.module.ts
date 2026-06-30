import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { IngredientCategoryEntity } from '@contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/ingredient-category.entity'

// Repositories
import { IngredientCategoryRepository } from '@contexts/inventory/ingredient-category/domain/repositories/ingredient-category.repository'
import { TypeOrmIngredientCategoryRepository } from '@contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/typeorm-ingredient-category.repository'

// Query Services
import { IngredientCategoryQueryService } from '@contexts/inventory/ingredient-category/application/services/ingredient-category-query.service'
import { TypeOrmIngredientCategoryQueryService } from '@contexts/inventory/ingredient-category/infrastructure/query-services/typeorm-ingredient-category-query.service'

// Events
import { EventBus } from '@/shared/domain/events'

// Command Handlers
import { CreateIngredientCategoryCommandHandler } from '@contexts/inventory/ingredient-category/application/create/create-ingredient-category.handler'
import { UpdateIngredientCategoryCommandHandler } from '@contexts/inventory/ingredient-category/application/update/update-ingredient-category.handler'

// Query Handlers
import { FindIngredientCategoryHandler } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category.handler'
import { FindAllIngredientCategoryHandler } from '@contexts/inventory/ingredient-category/application/find-all/find-all-ingredient-category.handler'
import { SearchIngredientCategoriesByCriteriaHandler } from '@contexts/inventory/ingredient-category/application/search-by-criteria/search-ingredient-categories-by-criteria.handler'

// Use Cases
import { CreateIngredientCategory } from '@contexts/inventory/ingredient-category/application/create/create-ingredient-category'
import { UpdateIngredientCategory } from '@contexts/inventory/ingredient-category/application/update/update-ingredient-category'
import { FindIngredientCategory } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category'
import { FindAllIngredientCategories } from '@contexts/inventory/ingredient-category/application/find-all/find-all-ingredient-category'
import { SearchIngredientCategoriesByCriteria } from '@contexts/inventory/ingredient-category/application/search-by-criteria/search-ingredient-categories-by-criteria'

// Controllers
import { IngredientCategoryController } from '@contexts/inventory/ingredient-category/presentation/http/controllers/ingredient-category.controller'

// Utils
import { createProvider } from '@/core/utils/create-provider'

const CommandHandlers = [
  CreateIngredientCategoryCommandHandler,
  UpdateIngredientCategoryCommandHandler
]

const QueryHandlers = [
  FindIngredientCategoryHandler,
  FindAllIngredientCategoryHandler,
  SearchIngredientCategoriesByCriteriaHandler
]

@Module({
  imports: [TypeOrmModule.forFeature([IngredientCategoryEntity])],
  controllers: [IngredientCategoryController],
  providers: [
    // REPOSITORIES
    {
      provide: IngredientCategoryRepository,
      useClass: TypeOrmIngredientCategoryRepository
    },

    // QUERY SERVICES
    {
      provide: IngredientCategoryQueryService,
      useClass: TypeOrmIngredientCategoryQueryService
    },

    // USE CASES
    createProvider(CreateIngredientCategory, [IngredientCategoryRepository, EventBus]),
    createProvider(UpdateIngredientCategory, [
      IngredientCategoryRepository,
      EventBus,
      FindIngredientCategory
    ]),
    createProvider(FindIngredientCategory, [IngredientCategoryRepository]),
    createProvider(FindAllIngredientCategories, [IngredientCategoryRepository]),
    createProvider(SearchIngredientCategoriesByCriteria, [IngredientCategoryQueryService]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers
  ],
  exports: [IngredientCategoryRepository, FindIngredientCategory]
})
export class IngredientCategoryModule {}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { IngredientCategoryEntity } from '@contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/ingredient-category.entity'

// Repositories
import { IngredientCategoryRepository } from '@contexts/inventory/ingredient-category/domain/repositories/ingredient-category.repository'
import { TypeOrmIngredientCategoryRepository } from '@contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/typeorm-ingredient-category.repository'

// Events
import { EventBus } from '@/shared/domain/events'

// Command Handlers
import { CreateIngredientCategoryCommandHandler } from '@contexts/inventory/ingredient-category/application/create/create-ingredient-category.handler'

// Query Handlers
import { FindIngredientCategoryHandler } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category.handler'
import { FindAllIngredientCategoryHandler } from '@contexts/inventory/ingredient-category/application/find-all/find-all-ingredient-category.handler'

// Use Cases
import { CreateIngredientCategory } from '@contexts/inventory/ingredient-category/application/create/create-ingredient-category'
import { FindIngredientCategory } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category'
import { FindAllIngredientCategories } from '@contexts/inventory/ingredient-category/application/find-all/find-all-ingredient-category'

// Controllers
import { IngredientCategoryController } from '@contexts/inventory/ingredient-category/presentation/http/controllers/ingredient-category.controller'

// Utils
import { createUseCaseProvider } from '@core/utils/createUseCaseProvider'

const CommandHandlers = [CreateIngredientCategoryCommandHandler]

const QueryHandlers = [FindIngredientCategoryHandler, FindAllIngredientCategoryHandler]

@Module({
  imports: [TypeOrmModule.forFeature([IngredientCategoryEntity])],
  controllers: [IngredientCategoryController],
  providers: [
    // REPOSITORIES
    {
      provide: IngredientCategoryRepository,
      useClass: TypeOrmIngredientCategoryRepository
    },

    // USE CASES
    createUseCaseProvider(CreateIngredientCategory, [IngredientCategoryRepository, EventBus]),
    createUseCaseProvider(FindIngredientCategory, [IngredientCategoryRepository]),
    createUseCaseProvider(FindAllIngredientCategories, [IngredientCategoryRepository]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers
  ],
  exports: [IngredientCategoryRepository, FindIngredientCategory]
})
export class IngredientCategoryModule {}

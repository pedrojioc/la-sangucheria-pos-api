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

// Use Cases
import { CreateIngredientCategory } from '@contexts/inventory/ingredient-category/application/create/create-ingredient-category'
import { UpdateIngredientCategory } from '@contexts/inventory/ingredient-category/application/update/update-ingredient-category'
import { FindIngredientCategory } from '@contexts/inventory/ingredient-category/application/find/find-ingredient-category'
import { SearchIngredientCategoriesByCriteria } from '@contexts/inventory/ingredient-category/application/search-by-criteria/search-ingredient-categories-by-criteria'

// Controllers
import { IngredientCategoryController } from '@contexts/inventory/ingredient-category/presentation/http/controllers/ingredient-category.controller'

// Utils
import { createProvider } from '@/core/utils/create-provider'

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
    createProvider(SearchIngredientCategoriesByCriteria, [IngredientCategoryQueryService])
  ],
  exports: [IngredientCategoryRepository, FindIngredientCategory]
})
export class IngredientCategoryModule {}

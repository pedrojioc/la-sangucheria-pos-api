import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { ProductCategoryEntity } from '@/contexts/menu/product-category/infrastructure/persistence/typeorm/product-category.entity'

// Repositories
import { ProductCategoryRepository } from '@/contexts/menu/product-category/domain/repositories/product-category.repository'
import { TypeOrmProductCategoryRepository } from '@/contexts/menu/product-category/infrastructure/persistence/typeorm/typeorm-product-category.repository'

// Query Services
import { ProductCategoryQueryService } from '@/contexts/menu/product-category/application/services/product-category-query.service'
import { TypeOrmProductCategoryQueryService } from '@/contexts/menu/product-category/infrastructure/query-services/typeorm-product-category-query.service'

// Events
import { EventBus } from '@/shared/domain/events'

// Command Handlers
import { CreateProductCategoryHandler } from '@/contexts/menu/product-category/application/create/create-product-category.handler'
import { UpdateProductCategoryCommandHandler } from '@/contexts/menu/product-category/application/update/update-product-category.handler'
import { DeleteProductCategoryCommandHandler } from '@/contexts/menu/product-category/application/delete/delete-product-category.handler'

// Query Handlers
import { FindProductCategoryHander } from '@/contexts/menu/product-category/application/find/find-product-category.handler'
import { SearchProductCategoriesByCriteriaHandler } from '@/contexts/menu/product-category/application/search-by-criteria/search-product-categories-by-criteria.handler'

// Use Cases
import { CreateProductCategory } from '@/contexts/menu/product-category/application/create/create-product-category'
import { UpdateProductCategory } from '@/contexts/menu/product-category/application/update/update-product-category'
import { DeleteProductCategory } from '@/contexts/menu/product-category/application/delete/delete-product-category'
import { FindProductCategory } from '@/contexts/menu/product-category/application/find/find-product-category'
import { SearchProductCategoriesByCriteria } from '@/contexts/menu/product-category/application/search-by-criteria/search-product-categories-by-criteria'

// Controllers
import { ProductCategoriesController } from '@/contexts/menu/product-category/presentation/http/controllers/product-categories.controller'

// Subscribers
import { ReactOnCategoryCreated } from '@/contexts/menu/product-category/application/subscribers/react-on-category-created'

// Utils
import { createProvider } from '@/core/utils/create-provider'

const CommandHandlers = [
  CreateProductCategoryHandler,
  UpdateProductCategoryCommandHandler,
  DeleteProductCategoryCommandHandler
]

const QueryHandlers = [FindProductCategoryHander, SearchProductCategoriesByCriteriaHandler]

const Subscribers = [ReactOnCategoryCreated]

@Module({
  imports: [TypeOrmModule.forFeature([ProductCategoryEntity])],
  controllers: [ProductCategoriesController],
  providers: [
    // REPOSITORIES
    {
      provide: ProductCategoryRepository,
      useClass: TypeOrmProductCategoryRepository
    },

    // QUERY SERVICES
    {
      provide: ProductCategoryQueryService,
      useClass: TypeOrmProductCategoryQueryService
    },

    // USE CASES
    createProvider(CreateProductCategory, [ProductCategoryRepository, EventBus]),
    createProvider(UpdateProductCategory, [ProductCategoryRepository, EventBus]),
    createProvider(DeleteProductCategory, [ProductCategoryRepository, EventBus]),
    createProvider(FindProductCategory, [ProductCategoryRepository]),
    createProvider(SearchProductCategoriesByCriteria, [ProductCategoryQueryService]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers,

    // SUBSCRIBERS
    ...Subscribers
  ],
  exports: [ProductCategoryRepository, FindProductCategory]
})
export class ProductCategoryModule {}

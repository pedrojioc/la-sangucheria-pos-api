import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { ProductCategoryEntity } from '@/contexts/menu/product-category/infrastructure/persistence/typeorm/product-category.entity'

// Repositories
import { ProductCategoryRepository } from '@/contexts/menu/product-category/domain/repositories/product-category.repository'
import { TypeOrmProductCategoryRepository } from '@/contexts/menu/product-category/infrastructure/persistence/typeorm/typeorm-product-category.repository'

// Events
import { EventBus } from '@/shared/domain/events'

// Command Handlers
import { CreateProductCategoryHandler } from '@/contexts/menu/product-category/application/create/create-product-category.handler'
import { UpdateProductCategoryCommandHandler } from '@/contexts/menu/product-category/application/update/update-product-category.handler'
import { DeleteProductCategoryCommandHandler } from '@/contexts/menu/product-category/application/delete/delete-product-category.handler'

// Query Handlers
import { FindProductCategoryHander } from '@/contexts/menu/product-category/application/find/find-product-category.handler'
import { FindAllProductCategoriesHandler } from '@/contexts/menu/product-category/application/find-all/find-all-product-categories.handler'

// Use Cases
import { CreateProductCategory } from '@/contexts/menu/product-category/application/create/create-product-category'
import { UpdateProductCategory } from '@/contexts/menu/product-category/application/update/update-product-category'
import { DeleteProductCategory } from '@/contexts/menu/product-category/application/delete/delete-product-category'
import { FindProductCategory } from '@/contexts/menu/product-category/application/find/find-product-category'
import { FindAllProductCategories } from '@/contexts/menu/product-category/application/find-all/find-all-product-categories'

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

const QueryHandlers = [FindProductCategoryHander, FindAllProductCategoriesHandler]

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

    // USE CASES
    createProvider(CreateProductCategory, [ProductCategoryRepository, EventBus]),
    createProvider(UpdateProductCategory, [ProductCategoryRepository, EventBus]),
    createProvider(DeleteProductCategory, [ProductCategoryRepository, EventBus]),
    createProvider(FindProductCategory, [ProductCategoryRepository]),
    createProvider(FindAllProductCategories, [ProductCategoryRepository]),

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

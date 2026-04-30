import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { ProductEntity } from '@contexts/menu/product/infrastructure/persistence/typeorm/product.entity'

// Repositories
import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'
import { TypeOrmProductRepository } from '@contexts/menu/product/infrastructure/persistence/typeorm/typeorm-product.repository'

// Product Categories (dependency)
import { ProductCategoryModule } from '@contexts/menu/product-category/product-category.module'

// Events
import { EventBus } from '@/shared/domain/events'

// Command Handlers
import { CreateProductCommandHandler } from '@/contexts/menu/product/application/create/create-product.handler'
import { UpdateProductCommandHandler } from '@/contexts/menu/product/application/update/update-product.handler'
import { DeleteProductCommandHandler } from '@/contexts/menu/product/application/delete/delete-product.handler'

// Query Handlers
import { FindProductHandler } from '@/contexts/menu/product/application/find/find-product.handler'
import { SearchProductsByCriteriaHandler } from '@/contexts/menu/product/application/search-by-criteria/search-products-by-criteria.handler'
import { GenerateProductSkuHandler } from '@/contexts/menu/product/application/generate-sku/generate-product-sku.handler'

// Use Cases
import { CreateProduct } from '@/contexts/menu/product/application/create/create-product'
import { UpdateProduct } from '@/contexts/menu/product/application/update/update-product'
import { DeleteProduct } from '@/contexts/menu/product/application/delete/delete-product'
import { FindProduct } from '@/contexts/menu/product/application/find/find-product'
import { SearchProductsByCriteria } from '@/contexts/menu/product/application/search-by-criteria/search-products-by-criteria'
import { GenerateProductSku } from '@/contexts/menu/product/application/generate-sku/generate-product-sku'

// Controllers
import { ProductController } from '@/contexts/menu/product/presentation/http/controllers/product.controller'

// Utils
import { createProvider } from '@/core/utils/create-provider'
import { LocalFileStorage } from '@/shared/infrastructure/storage/local/local-file-storage.service'
import { FileStorageRepository } from '@/shared/domain/file-storage'
import { FindProductCategory } from '@/contexts/menu/product-category/application/find/find-product-category'

const CommandHandlers = [
  CreateProductCommandHandler,
  UpdateProductCommandHandler,
  DeleteProductCommandHandler
]

const QueryHandlers = [
  FindProductHandler,
  SearchProductsByCriteriaHandler,
  GenerateProductSkuHandler
]

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity]), ProductCategoryModule],
  controllers: [ProductController],
  providers: [
    // REPOSITORIES
    {
      provide: ProductRepository,
      useClass: TypeOrmProductRepository
    },
    {
      provide: FileStorageRepository,
      useExisting: LocalFileStorage
    },

    // USE CASES
    createProvider(CreateProduct, [
      ProductRepository,
      FindProductCategory,
      FileStorageRepository,
      EventBus
    ]),
    createProvider(UpdateProduct, [
      ProductRepository,
      FindProductCategory,
      FileStorageRepository,
      EventBus
    ]),
    createProvider(DeleteProduct, [ProductRepository, FileStorageRepository, EventBus]),
    createProvider(FindProduct, [ProductRepository]),
    createProvider(SearchProductsByCriteria, [ProductRepository]),
    createProvider(GenerateProductSku, [ProductRepository]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers
  ],
  exports: [ProductRepository]
})
export class ProductModule {}

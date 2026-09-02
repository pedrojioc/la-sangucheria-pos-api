import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { ProductEntity } from '@contexts/menu/product/infrastructure/persistence/typeorm/product.entity'

// Repositories
import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'
import { TypeOrmProductRepository } from '@contexts/menu/product/infrastructure/persistence/typeorm/typeorm-product.repository'

// Dependencies
import { ProductCategoryModule } from '@contexts/menu/product-category/product-category.module'
import { IngredientModule } from '@contexts/inventory/ingredient/ingredient.module'

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

// Query Services
import { ProductQueryService } from '@/contexts/menu/product/application/services/product-query.service'
import { TypeOrmProductQueryService } from '@/contexts/menu/product/infrastructure/query-services/typeorm-product-query.service'
import { ProductAvailabilityQueryService } from '@/contexts/menu/product/application/services/product-availability-query.service'
import { TypeOrmProductAvailabilityQueryService } from '@/contexts/menu/product/infrastructure/query-services/typeorm-product-availability-query.service'

// Controllers
import { ProductController } from '@/contexts/menu/product/presentation/http/controllers/product.controller'

// Subscribers
import { OnProductRecipeSavedUpdateStrategySubscriber } from '@/contexts/menu/product/application/on-product-recipe-saved/on-product-recipe-saved-update-strategy.subscriber'
import { OnProductRecipeSavedUpdateStrategy } from '@/contexts/menu/product/application/on-product-recipe-saved/on-product-recipe-saved-update-strategy'

// Utils
import { createProvider } from '@/core/utils/create-provider'
import { LocalFileStorage } from '@/shared/infrastructure/storage/local/local-file-storage.service'
import { FileStorageRepository } from '@/shared/domain/file-storage'
import { FindProductCategory } from '@/contexts/menu/product-category/application/find/find-product-category'
import { FindIngredient } from '@/contexts/inventory/ingredient/application/find/find-ingredient'

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

const Subscribers = [OnProductRecipeSavedUpdateStrategySubscriber]

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity]), ProductCategoryModule, IngredientModule],
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

    // QUERY SERVICES
    {
      provide: ProductQueryService,
      useClass: TypeOrmProductQueryService
    },
    {
      provide: ProductAvailabilityQueryService,
      useClass: TypeOrmProductAvailabilityQueryService
    },

    // USE CASES
    createProvider(CreateProduct, [
      ProductRepository,
      FindProductCategory,
      FindIngredient,
      FileStorageRepository,
      EventBus
    ]),
    createProvider(UpdateProduct, [
      ProductRepository,
      FindProductCategory,
      FindIngredient,
      FileStorageRepository,
      EventBus
    ]),
    createProvider(DeleteProduct, [ProductRepository, FileStorageRepository, EventBus]),
    createProvider(FindProduct, [ProductRepository]),
    createProvider(SearchProductsByCriteria, [ProductQueryService]),
    createProvider(GenerateProductSku, [ProductRepository]),

    // USE CASE (subscriber)
    createProvider(OnProductRecipeSavedUpdateStrategy, [ProductRepository]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers,

    // SUBSCRIBERS
    ...Subscribers
  ],
  exports: [ProductRepository]
})
export class ProductModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly onProductRecipeSavedUpdateStrategySubscriber: OnProductRecipeSavedUpdateStrategySubscriber
  ) {}

  onModuleInit(): void {
    this.eventBus.addSubscribers([this.onProductRecipeSavedUpdateStrategySubscriber])
  }
}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'

// Entities
import { OptionGroupEntity } from './infrastructure/persistence/typeorm/option-group.entity'
import { OptionItemEntity } from './infrastructure/persistence/typeorm/option-item.entity'
import { ProductOptionGroupEntity } from './infrastructure/persistence/typeorm/product-option-group.entity'
import { ProductEntity } from '@contexts/menu/product/infrastructure/persistence/typeorm/product.entity'
import { ProductRecipeEntity } from '@contexts/menu/product-recipe/infrastructure/persistence/typeorm/product-recipe.entity'

// Repositories
import { OptionGroupRepository } from './domain/repositories/option-group.repository'
import { ProductOptionGroupRepository } from './domain/repositories/product-option-group.repository'
import { TypeOrmOptionGroupRepository } from './infrastructure/persistence/typeorm/typeorm-option-group.repository'
import { TypeOrmProductOptionGroupRepository } from './infrastructure/persistence/typeorm/typeorm-product-option-group.repository'

// Query services
import { TypeOrmProductWithOptionsQueryService } from './infrastructure/query-services/typeorm-product-with-options-query.service'
import { TypeOrmOptionGroupQueryService } from './infrastructure/query-services/typeorm-option-group-query.service'

// Product dependency
import { ProductModule } from '@contexts/menu/product/product.module'
import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'

// Events
import { EventBus } from '@shared/domain/events'

// Use Cases
import { CreateOptionGroup } from './application/create/create-option-group'
import { UpdateOptionGroup } from './application/update/update-option-group'
import { DeactivateOptionGroup } from './application/deactivate/deactivate-option-group'
import { FindOptionGroup } from './application/find/find-option-group'
import { FindAllOptionGroups } from './application/find-all/find-all-option-groups'
import { AssignProductOptionGroups } from './application/assign/assign-product-option-groups'
import { FindProductWithOptions } from './application/find-product-with-options/find-product-with-options'
import { SearchOptionGroupsByCriteria } from './application/search-by-criteria/search-option-groups-by-criteria'

// CQRS Handlers
import { FindProductWithOptionsHandler } from './application/find-product-with-options/find-product-with-options.handler'
import { SearchOptionGroupsByCriteriaHandler } from './application/search-by-criteria/search-option-groups-by-criteria.handler'

// Query service interfaces
import { OptionGroupQueryService } from './application/services/option-group-query.service'

// Controllers
import { OptionGroupController } from './presentation/http/controllers/option-group.controller'
import { ProductOptionGroupController } from './presentation/http/controllers/product-option-group.controller'

// Utils
import { createProvider } from '@core/utils/create-provider'

const QueryHandlers = [FindProductWithOptionsHandler, SearchOptionGroupsByCriteriaHandler]

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([
      OptionGroupEntity,
      OptionItemEntity,
      ProductOptionGroupEntity,
      ProductEntity,
      ProductRecipeEntity
    ]),
    ProductModule
  ],
  controllers: [OptionGroupController, ProductOptionGroupController],
  providers: [
    // REPOSITORIES
    {
      provide: OptionGroupRepository,
      useClass: TypeOrmOptionGroupRepository
    },
    {
      provide: ProductOptionGroupRepository,
      useClass: TypeOrmProductOptionGroupRepository
    },

    // QUERY SERVICES
    TypeOrmProductWithOptionsQueryService,
    {
      provide: OptionGroupQueryService,
      useClass: TypeOrmOptionGroupQueryService
    },

    // USE CASES
    createProvider(CreateOptionGroup, [OptionGroupRepository, EventBus]),
    createProvider(UpdateOptionGroup, [OptionGroupRepository, EventBus]),
    createProvider(DeactivateOptionGroup, [OptionGroupRepository, EventBus]),
    createProvider(FindOptionGroup, [OptionGroupRepository]),
    createProvider(FindAllOptionGroups, [OptionGroupRepository]),
    createProvider(AssignProductOptionGroups, [
      ProductRepository,
      OptionGroupRepository,
      ProductOptionGroupRepository
    ]),
    createProvider(FindProductWithOptions, [TypeOrmProductWithOptionsQueryService]),
    createProvider(SearchOptionGroupsByCriteria, [OptionGroupQueryService]),

    // QUERY HANDLERS
    ...QueryHandlers
  ],
  exports: [OptionGroupRepository, ProductOptionGroupRepository, FindProductWithOptionsHandler]
})
export class ProductOptionModule {}

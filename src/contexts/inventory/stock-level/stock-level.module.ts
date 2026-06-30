import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'

// Entities
import { InventoryMovementEntity } from './infrastructure/persistence/typeorm/inventory-movement.entity'
import { InventoryLevelEntity } from './infrastructure/persistence/typeorm/inventory-level.entity'

// Repositories
import { InventoryMovementRepository } from './domain/repositories/inventory-movement.repository'
import { InventoryLevelRepository } from './domain/repositories/inventory-level.repository'
import { TypeOrmInventoryMovementRepository } from './infrastructure/persistence/typeorm/typeorm-inventory-movement.repository'
import { TypeOrmInventoryLevelRepository } from './infrastructure/persistence/typeorm/typeorm-inventory-level.repository'

// Batch dependencies
import { InventoryBatchRepository } from '@/contexts/inventory/batch/domain/repositories/inventory-batch.repository'
import { FifoInventoryService } from '@/contexts/inventory/batch/domain/services/fifo-inventory.service'
import { InventoryBatchModule } from '@/contexts/inventory/batch/inventory-batch.module'
import { GetIngredientFifoCost } from './application/get-ingredient-fifo-cost/get-ingredient-fifo-cost'

// Query Services
import { InventoryLevelQueryService } from './application/services/inventory-level-query.service'
import { TypeOrmInventoryLevelQueryService } from './infrastructure/query-services/typeorm-inventory-level-query.service'
import { InventoryLevelStatisticsQueryService } from './application/services/inventory-level-statistics-query.service'
import { TypeOrmInventoryLevelStatisticsQueryService } from './infrastructure/query-services/typeorm-inventory-level-statistics-query.service'

// Use Cases
import { CreatePurchaseMovement } from './application/create-purchase-movement/create-purchase-movement'
import { UpdateInventoryLevel } from './application/update-inventory-level/update-inventory-level'
import { SearchInventoryLevelsByCriteria } from './application/search-by-criteria/search-inventory-levels-by-criteria'
import { GetInventoryLevelStatistics } from './application/get-statistics/get-inventory-level-statistics'
import { RegisterManualAdjustment } from './application/register-manual-adjustment/register-manual-adjustment'
import { DeductIngredient } from './application/deduct/deduct-ingredient'
import { AddProducedStock } from './application/add-produced-stock/add-produced-stock'
import { InitializeInventoryLevel } from './application/initialize-inventory-level/initialize-inventory-level'

// Handlers
import { SearchInventoryLevelsByCriteriaHandler } from './application/search-by-criteria/search-inventory-levels-by-criteria.handler'
import { GetInventoryLevelStatisticsHandler } from './application/get-statistics/get-inventory-level-statistics.handler'
import { RegisterManualAdjustmentHandler } from './application/register-manual-adjustment/register-manual-adjustment.handler'

// Subscribers
import { CreateInventoryLevelOnIngredientCreated } from './application/subscribers/create-inventory-level-on-ingredient-created'

// Controllers
import { InventoryLevelController } from './presentation/http/controllers/inventory-level.controller'

// Shared
import { EventBus } from '@/shared/domain/events'
import { createProvider } from '@/core/utils/create-provider'

@Module({
  imports: [
    TypeOrmModule.forFeature([InventoryMovementEntity, InventoryLevelEntity]),
    CqrsModule,
    InventoryBatchModule
  ],
  controllers: [InventoryLevelController],
  providers: [
    // Repositories
    {
      provide: InventoryMovementRepository,
      useClass: TypeOrmInventoryMovementRepository
    },
    {
      provide: InventoryLevelRepository,
      useClass: TypeOrmInventoryLevelRepository
    },

    // Query Services
    {
      provide: InventoryLevelQueryService,
      useClass: TypeOrmInventoryLevelQueryService
    },
    {
      provide: InventoryLevelStatisticsQueryService,
      useClass: TypeOrmInventoryLevelStatisticsQueryService
    },

    // Domain Services
    { provide: FifoInventoryService, useClass: FifoInventoryService },

    // Use Cases - Commands
    createProvider(CreatePurchaseMovement, [InventoryMovementRepository, EventBus]),
    createProvider(UpdateInventoryLevel, [InventoryLevelRepository, EventBus]),
    createProvider(GetIngredientFifoCost, [InventoryBatchRepository, FifoInventoryService]),
    createProvider(DeductIngredient, [
      InventoryBatchRepository,
      InventoryMovementRepository,
      InventoryLevelRepository,
      FifoInventoryService,
      EventBus
    ]),
    createProvider(AddProducedStock, [
      InventoryBatchRepository,
      InventoryMovementRepository,
      InventoryLevelRepository,
      EventBus
    ]),
    createProvider(RegisterManualAdjustment, [
      InventoryMovementRepository,
      InventoryLevelRepository,
      GetIngredientFifoCost,
      EventBus
    ]),
    createProvider(InitializeInventoryLevel, [InventoryLevelRepository]),

    // Use Cases - Queries
    createProvider(SearchInventoryLevelsByCriteria, [InventoryLevelQueryService]),
    createProvider(GetInventoryLevelStatistics, [InventoryLevelStatisticsQueryService]),

    // Handlers
    SearchInventoryLevelsByCriteriaHandler,
    GetInventoryLevelStatisticsHandler,
    RegisterManualAdjustmentHandler,

    // Event Subscribers
    {
      provide: CreateInventoryLevelOnIngredientCreated,
      useFactory: (useCase: InitializeInventoryLevel) =>
        new CreateInventoryLevelOnIngredientCreated(useCase),
      inject: [InitializeInventoryLevel]
    }
  ],
  exports: [
    InventoryMovementRepository,
    InventoryLevelRepository,
    GetIngredientFifoCost,
    DeductIngredient,
    AddProducedStock
  ]
})
export class StockLevelModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly createLevelSubscriber: CreateInventoryLevelOnIngredientCreated
  ) {}

  onModuleInit(): void {
    this.eventBus.addSubscribers([this.createLevelSubscriber])
  }
}

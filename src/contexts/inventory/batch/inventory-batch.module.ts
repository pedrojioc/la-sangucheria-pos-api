import { Module, OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CqrsModule } from '@nestjs/cqrs'

// Entities
import { InventoryBatchEntity } from './infrastructure/persistence/typeorm/inventory-batch.entity'

// Repositories
import { InventoryBatchRepository } from './domain/repositories/inventory-batch.repository'
import { TypeOrmInventoryBatchRepository } from './infrastructure/persistence/typeorm/typeorm-inventory-batch.repository'

// Use Cases
import { RegisterPurchase } from './application/register-purchase/register-purchase'

// Handlers
import { RegisterPurchaseHandler } from './application/register-purchase/register-purchase.handler'

// Subscribers
import { CreateInventoryBatchOnPurchaseOrderReceived } from './application/subscribers/create-inventory-batch-on-purchase-order-received'

// Dependencies from other modules
import { IngredientRepository } from '@/contexts/inventory/ingredient/domain/repositories/ingredient.repository'
import { UnitConversionRepository } from '@/contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { EventBus } from '@/shared/domain/events'

// Utils
import { createProvider } from '@/core/utils/create-provider'

// Import modules that export required dependencies
import { IngredientModule } from '../ingredient/ingredient.module'

const CommandHandlers = [RegisterPurchaseHandler]

@Module({
  imports: [TypeOrmModule.forFeature([InventoryBatchEntity]), CqrsModule, IngredientModule],
  providers: [
    // Repositories
    {
      provide: InventoryBatchRepository,
      useClass: TypeOrmInventoryBatchRepository
    },

    // Use Cases
    createProvider(RegisterPurchase, [
      InventoryBatchRepository,
      IngredientRepository,
      UnitConversionRepository,
      EventBus
    ]),

    // Handlers
    ...CommandHandlers,

    // Event Subscribers
    {
      provide: CreateInventoryBatchOnPurchaseOrderReceived,
      useFactory: (useCase: RegisterPurchase) =>
        new CreateInventoryBatchOnPurchaseOrderReceived(useCase),
      inject: [RegisterPurchase]
    }
  ],
  exports: [InventoryBatchRepository, RegisterPurchase]
})
export class InventoryBatchModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly createBatchSubscriber: CreateInventoryBatchOnPurchaseOrderReceived
  ) {}

  onModuleInit(): void {
    this.eventBus.addSubscribers([this.createBatchSubscriber])
  }
}

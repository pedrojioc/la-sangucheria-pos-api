import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { CqrsModule } from '@nestjs/cqrs'
import { EventEmitterModule } from '@nestjs/event-emitter'

// Configuration
import { EnvConfigModule } from './config/env/env.config'
import { DatabaseModule } from './config/database/database.module'
import appConfig from './config/app.config'

// Shared Infrastructure
import { SharedInfrastructureModule } from '@shared/infrastructure/shared-infrastructure.module'

//import { EventStoreService } from '../../shared/infrastructure/event-sourcing/event-store.service'
import { InMemoryEventBusModule } from '@shared/infrastructure/event-bus/in-memory/in-memory-event-bus.module'

// Feature Modules
import { IngredientCategoryModule } from '@contexts/inventory/ingredient-category/ingredient-category.module'
import { IngredientModule } from '@contexts/inventory/ingredient/ingredient.module'
import { UnitModule } from '@contexts/shared-kernel/unit/unit.module'
import { ProductCategoryModule } from '@contexts/menu/product-category/product-category.module'
import { ProductModule } from '@contexts/menu/product/product.module'
import { PurchaseOrderModule } from '@contexts/procurement/purchase-order/purchase-order.module'

@Module({
  imports: [
    // =====================================
    // CONFIGURATION
    // =====================================
    EnvConfigModule,
    ConfigModule.forFeature(appConfig),

    // =====================================
    // DATABASE
    // =====================================
    DatabaseModule,

    // =====================================
    // SHARED INFRASTRUCTURE (Global)
    // =====================================
    SharedInfrastructureModule,

    // =====================================
    // FEATURE MODULES
    // =====================================
    UnitModule,
    IngredientCategoryModule,
    IngredientModule,
    ProductCategoryModule,
    ProductModule,
    PurchaseOrderModule
  ],

  providers: [
    /*, EventStoreService*/
  ],
  exports: [
    /*, EventStoreService*/
  ]
})
export class AppModule {}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { BillingConfigEntity } from '@contexts/billing/billing-config/infrastructure/persistence/typeorm/billing-config.entity'

// Repositories
import { BillingConfigRepository } from '@contexts/billing/billing-config/domain/repositories/billing-config.repository'
import { TypeOrmBillingConfigRepository } from '@contexts/billing/billing-config/infrastructure/persistence/typeorm/typeorm-billing-config.repository'

// Events
import { EventBus } from '@shared/domain/events'

// Use Cases
import { GetBillingConfig } from '@contexts/billing/billing-config/application/get-billing-config/get-billing-config'
import { UpdateBillingConfig } from '@contexts/billing/billing-config/application/update-billing-config/update-billing-config'

// Controllers
import { BillingConfigController } from '@contexts/billing/billing-config/presentation/billing-config.controller'

// Utils
import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([BillingConfigEntity])],
  controllers: [BillingConfigController],
  providers: [
    // REPOSITORIES
    {
      provide: BillingConfigRepository,
      useClass: TypeOrmBillingConfigRepository
    },

    // USE CASES
    createProvider(GetBillingConfig, [BillingConfigRepository]),
    createProvider(UpdateBillingConfig, [BillingConfigRepository, EventBus])
  ],
  exports: [BillingConfigRepository]
})
export class BillingConfigModule {}

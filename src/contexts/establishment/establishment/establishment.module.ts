import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { EstablishmentEntity } from './infrastructure/persistence/typeorm/establishment.entity'

// Repositories
import { EstablishmentRepository } from './domain/repositories/establishment.repository'
import { TypeOrmEstablishmentRepository } from './infrastructure/persistence/typeorm/typeorm-establishment.repository'

// Events
import { EventBus } from '@shared/domain/events'

// Use Cases
import { GetEstablishmentSettings } from './application/get-settings/get-establishment-settings'
import { UpdateEstablishmentSettings } from './application/update-settings/update-establishment-settings'

// Controllers
import { EstablishmentController } from './presentation/http/controllers/establishment.controller'

// Utils
import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([EstablishmentEntity])],
  controllers: [EstablishmentController],
  providers: [
    // REPOSITORIES
    {
      provide: EstablishmentRepository,
      useClass: TypeOrmEstablishmentRepository
    },

    // USE CASES
    createProvider(GetEstablishmentSettings, [EstablishmentRepository]),
    createProvider(UpdateEstablishmentSettings, [EstablishmentRepository, EventBus])
  ],
  exports: [GetEstablishmentSettings]
})
export class EstablishmentModule {}

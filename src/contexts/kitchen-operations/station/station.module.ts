import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { StationEntity } from '@contexts/kitchen-operations/station/infrastructure/persistence/typeorm/station.entity'
import { StationRepository } from '@contexts/kitchen-operations/station/domain/repositories/station.repository'
import { TypeOrmStationRepository } from '@contexts/kitchen-operations/station/infrastructure/persistence/typeorm/typeorm-station.repository'

import { EventBus } from '@shared/domain/events'

import { CreateStation } from '@contexts/kitchen-operations/station/application/create/create-station'
import { UpdateStation } from '@contexts/kitchen-operations/station/application/update/update-station'
import { FindStation } from '@contexts/kitchen-operations/station/application/find/find-station'
import { FindAllStations } from '@contexts/kitchen-operations/station/application/find-all/find-all-stations'
import { DeleteStation } from '@contexts/kitchen-operations/station/application/delete/delete-station'

import { StationController } from '@contexts/kitchen-operations/station/presentation/http/controllers/station.controller'

import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([StationEntity])],
  controllers: [StationController],
  providers: [
    { provide: StationRepository, useClass: TypeOrmStationRepository },
    createProvider(FindStation, [StationRepository]),
    createProvider(FindAllStations, [StationRepository]),
    createProvider(CreateStation, [StationRepository, EventBus]),
    createProvider(UpdateStation, [StationRepository, EventBus, FindStation]),
    createProvider(DeleteStation, [StationRepository, EventBus])
  ],
  exports: [FindStation, StationRepository]
})
export class StationModule {}

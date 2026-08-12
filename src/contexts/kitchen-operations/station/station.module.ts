import { forwardRef, Module } from '@nestjs/common'
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
import { PrinterDeviceLookupPort } from '@contexts/kitchen-operations/station/domain/ports/printer-device-lookup.port'
import { PrinterDiscoveryModule } from '@contexts/kitchen-operations/printer-discovery/printer-discovery.module'
import { EstablishmentModule } from '@contexts/establishment/establishment/establishment.module'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'

@Module({
  imports: [
    TypeOrmModule.forFeature([StationEntity]),
    // EstablishmentModule imports StationModule (for StationOutputDevicesPort),
    // and PrinterDiscoveryModule imports EstablishmentModule — so this side
    // must use forwardRef to break the circular dependency, mirroring the
    // AgentGatewayModule <-> KitchenPrinterModule precedent.
    forwardRef(() => PrinterDiscoveryModule),
    // Needed to resolve the caller's establishmentId (singleton) before
    // calling PrinterDeviceLookupPort.findById, so cross-tenant device ids
    // are rejected instead of resolved by id alone. Same forwardRef reason
    // as PrinterDiscoveryModule above: EstablishmentModule -> StationModule.
    forwardRef(() => EstablishmentModule)
  ],
  controllers: [StationController],
  providers: [
    { provide: StationRepository, useClass: TypeOrmStationRepository },
    createProvider(FindStation, [StationRepository]),
    createProvider(FindAllStations, [StationRepository]),
    createProvider(CreateStation, [
      StationRepository,
      EventBus,
      PrinterDeviceLookupPort,
      EstablishmentRepository
    ]),
    createProvider(UpdateStation, [
      StationRepository,
      EventBus,
      FindStation,
      PrinterDeviceLookupPort,
      EstablishmentRepository
    ]),
    createProvider(DeleteStation, [StationRepository, EventBus])
  ],
  exports: [FindStation, StationRepository]
})
export class StationModule {}

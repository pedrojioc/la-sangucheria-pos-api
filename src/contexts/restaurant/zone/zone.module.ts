import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ZoneEntity } from '@contexts/restaurant/zone/infrastructure/persistence/typeorm/zone.entity'
import { ZoneRepository } from '@contexts/restaurant/zone/domain/repositories/zone.repository'
import { TypeOrmZoneRepository } from '@contexts/restaurant/zone/infrastructure/persistence/typeorm/typeorm-zone.repository'

import { EventBus } from '@shared/domain/events'

import { CreateZone } from '@contexts/restaurant/zone/application/create/create-zone'
import { UpdateZone } from '@contexts/restaurant/zone/application/update/update-zone'
import { FindZone } from '@contexts/restaurant/zone/application/find/find-zone'
import { FindAllZones } from '@contexts/restaurant/zone/application/find-all/find-all-zones'

import { ZoneController } from '@contexts/restaurant/zone/presentation/http/controllers/zone.controller'

import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([ZoneEntity])],
  controllers: [ZoneController],
  providers: [
    { provide: ZoneRepository, useClass: TypeOrmZoneRepository },
    createProvider(FindZone, [ZoneRepository]),
    createProvider(FindAllZones, [ZoneRepository]),
    createProvider(CreateZone, [ZoneRepository, EventBus]),
    createProvider(UpdateZone, [ZoneRepository, EventBus, FindZone])
  ],
  exports: [FindZone, ZoneRepository]
})
export class ZoneModule {}

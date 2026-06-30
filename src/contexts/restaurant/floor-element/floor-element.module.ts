import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { FloorElementEntity } from '@contexts/restaurant/floor-element/infrastructure/persistence/typeorm/floor-element.entity'
import { FloorElementRepository } from '@contexts/restaurant/floor-element/domain/repositories/floor-element.repository'
import { TypeOrmFloorElementRepository } from '@contexts/restaurant/floor-element/infrastructure/persistence/typeorm/typeorm-floor-element.repository'

import { EventBus } from '@shared/domain/events'

import { CreateFloorElement } from '@contexts/restaurant/floor-element/application/create/create-floor-element'
import { UpdateFloorElement } from '@contexts/restaurant/floor-element/application/update/update-floor-element'
import { DeleteFloorElement } from '@contexts/restaurant/floor-element/application/delete/delete-floor-element'
import { FindFloorElement } from '@contexts/restaurant/floor-element/application/find/find-floor-element'
import { FindAllFloorElements } from '@contexts/restaurant/floor-element/application/find-all/find-all-floor-elements'
import { FindAllFloorElementsByZone } from '@contexts/restaurant/floor-element/application/find-all-by-zone/find-all-floor-elements-by-zone'

import { FloorElementController } from '@contexts/restaurant/floor-element/presentation/http/controllers/floor-element.controller'

import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([FloorElementEntity])],
  controllers: [FloorElementController],
  providers: [
    { provide: FloorElementRepository, useClass: TypeOrmFloorElementRepository },
    createProvider(FindFloorElement, [FloorElementRepository]),
    createProvider(FindAllFloorElements, [FloorElementRepository]),
    createProvider(FindAllFloorElementsByZone, [FloorElementRepository]),
    createProvider(CreateFloorElement, [FloorElementRepository, EventBus]),
    createProvider(UpdateFloorElement, [FloorElementRepository, EventBus, FindFloorElement]),
    createProvider(DeleteFloorElement, [FloorElementRepository, FindFloorElement])
  ]
})
export class FloorElementModule {}

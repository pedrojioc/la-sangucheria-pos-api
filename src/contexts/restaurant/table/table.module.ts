import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { TableEntity } from '@contexts/restaurant/table/infrastructure/persistence/typeorm/table.entity'
import { OrderEntity } from '@contexts/orders/order/infrastructure/persistence/typeorm/order.entity'
import { TableRepository } from '@contexts/restaurant/table/domain/repositories/table.repository'
import { TypeOrmTableRepository } from '@contexts/restaurant/table/infrastructure/persistence/typeorm/typeorm-table.repository'

import { EventBus } from '@shared/domain/events'

import { CreateTable } from '@contexts/restaurant/table/application/create/create-table'
import { UpdateTable } from '@contexts/restaurant/table/application/update/update-table'
import { FindTable } from '@contexts/restaurant/table/application/find/find-table'
import { FindAllTables } from '@contexts/restaurant/table/application/find-all/find-all-tables'
import { MoveTable } from '@contexts/restaurant/table/application/move/move-table'
import { ChangeTableStatus } from '@contexts/restaurant/table/application/change-status/change-table-status'
import { OccupyTable } from '@contexts/restaurant/table/application/occupy/occupy-table'
import { ReleaseTable } from '@contexts/restaurant/table/application/release/release-table'
import { FindAllTablesWithOrders } from '@contexts/restaurant/table/application/find-all-with-orders/find-all-tables-with-orders'

import { TableQueryService } from '@contexts/restaurant/table/application/services/table-query.service'
import { TypeOrmTableQueryService } from '@contexts/restaurant/table/infrastructure/query-services/typeorm-table-query.service'

import { TableController } from '@contexts/restaurant/table/presentation/http/controllers/table.controller'

import { createProvider } from '@core/utils/create-provider'

@Module({
  imports: [TypeOrmModule.forFeature([TableEntity, OrderEntity])],
  controllers: [TableController],
  providers: [
    // REPOSITORIES
    {
      provide: TableRepository,
      useClass: TypeOrmTableRepository
    },

    // QUERY SERVICES
    {
      provide: TableQueryService,
      useClass: TypeOrmTableQueryService
    },

    // USE CASES
    createProvider(FindTable, [TableRepository]),
    createProvider(FindAllTables, [TableRepository]),
    createProvider(CreateTable, [TableRepository, EventBus]),
    createProvider(UpdateTable, [TableRepository, EventBus, FindTable]),
    createProvider(MoveTable, [TableRepository, EventBus, FindTable]),
    createProvider(ChangeTableStatus, [TableRepository, EventBus, FindTable]),
    createProvider(OccupyTable, [TableRepository, EventBus, FindTable]),
    createProvider(ReleaseTable, [TableRepository, EventBus, FindTable]),
    createProvider(FindAllTablesWithOrders, [TableQueryService])
  ],
  exports: [TableRepository, FindTable, ChangeTableStatus, OccupyTable, ReleaseTable]
})
export class TableModule {}

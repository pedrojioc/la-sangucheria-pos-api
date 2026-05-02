import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SupplierEntity } from './infrastructure/persistence/typeorm/supplier.entity'
import { SupplierRepository } from './domain/repositories/supplier.repository'
import { TypeOrmSupplierRepository } from './infrastructure/persistence/typeorm/typeorm-supplier.repository'
import { SupplierQueryService } from './application/services/supplier-query.service'
import { TypeOrmSupplierQueryService } from './infrastructure/query-services/typeorm-supplier-query.service'
import { EventBus } from '@/shared/domain/events'

import { CreateSupplierHandler } from './application/create/create-supplier.handler'
import { UpdateSupplierHandler } from './application/update/update-supplier.handler'
import { FindSupplierHandler } from './application/find/find-supplier.handler'
import { FindAllSuppliersHandler } from './application/find-all/find-all-supplier.handler'
import { SearchSuppliersByCriteriaHandler } from './application/search-by-criteria/search-suppliers-by-criteria.handler'
import { GetSupplierStatisticsHandler } from './application/get-statistics/get-supplier-statistics.handler'

import { CreateSupplier } from './application/create/create-supplier'
import { UpdateSupplier } from './application/update/update-supplier'
import { FindSupplier } from './application/find/find-supplier'
import { FindAllSuppliers } from './application/find-all/find-all-supplier'
import { SearchSuppliersByCriteria } from './application/search-by-criteria/search-suppliers-by-criteria'
import { GetSupplierStatistics } from './application/get-statistics/get-supplier-statistics'
import { ReactOnSupplierCreated } from './application/subscribers/react-on-supplier-created'

import { SupplierController } from './presentation/http/controllers/supplier.controller'
import { createProvider } from '@/core/utils/create-provider'

const CommandHandlers = [CreateSupplierHandler, UpdateSupplierHandler]
const QueryHandlers = [
  FindSupplierHandler,
  FindAllSuppliersHandler,
  SearchSuppliersByCriteriaHandler,
  GetSupplierStatisticsHandler
]
const EventSubscribers = [ReactOnSupplierCreated]

@Module({
  imports: [TypeOrmModule.forFeature([SupplierEntity])],
  controllers: [SupplierController],
  providers: [
    { provide: SupplierRepository, useClass: TypeOrmSupplierRepository },
    { provide: SupplierQueryService, useClass: TypeOrmSupplierQueryService },

    createProvider(CreateSupplier, [SupplierRepository, EventBus]),
    createProvider(UpdateSupplier, [SupplierRepository, EventBus]),
    createProvider(FindSupplier, [SupplierRepository]),
    createProvider(FindAllSuppliers, [SupplierRepository]),
    createProvider(SearchSuppliersByCriteria, [SupplierQueryService]),
    createProvider(GetSupplierStatistics, [SupplierRepository]),

    ...CommandHandlers,
    ...QueryHandlers,
    ...EventSubscribers
  ],
  exports: [SupplierRepository, CreateSupplier, FindSupplier]
})
export class SupplierModule {}

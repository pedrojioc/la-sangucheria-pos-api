import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { SupplierEntity } from './infrastructure/persistence/typeorm/supplier.entity'

// Repositories
import { SupplierRepository } from './domain/repositories/supplier.repository'
import { TypeOrmSupplierRepository } from './infrastructure/persistence/typeorm/typeorm-supplier.repository'

// Events
import { EventBus } from '@/shared/domain/events'

// Command Handlers
import { CreateSupplierHandler } from './application/create/create-supplier.handler'
import { UpdateSupplierHandler } from './application/update/update-supplier.handler'

// Query Handlers
import { FindSupplierHandler } from './application/find/find-supplier.handler'
import { FindAllSuppliersHandler } from './application/find-all/find-all-supplier.handler'
import { SearchSuppliersByCriteriaHandler } from './application/search-by-criteria/search-suppliers-by-criteria.handler'

// Use Cases
import { CreateSupplier } from './application/create/create-supplier'
import { UpdateSupplier } from './application/update/update-supplier'
import { FindSupplier } from './application/find/find-supplier'
import { FindAllSuppliers } from './application/find-all/find-all-supplier'
import { SearchSuppliersByCriteria } from './application/search-by-criteria/search-suppliers-by-criteria'

// Subscribers
import { ReactOnSupplierCreated } from './application/subscribers/react-on-supplier-created'

// Controllers
import { SupplierController } from './presentation/http/controllers/supplier.controller'

// Utils
import { createUseCaseProvider } from '@/core/utils/createUseCaseProvider'

const CommandHandlers = [CreateSupplierHandler, UpdateSupplierHandler]

const QueryHandlers = [
  FindSupplierHandler,
  FindAllSuppliersHandler,
  SearchSuppliersByCriteriaHandler
]

const EventSubscribers = [ReactOnSupplierCreated]

@Module({
  imports: [TypeOrmModule.forFeature([SupplierEntity])],
  controllers: [SupplierController],
  providers: [
    // REPOSITORIES
    {
      provide: SupplierRepository,
      useClass: TypeOrmSupplierRepository
    },

    // USE CASES
    createUseCaseProvider(CreateSupplier, [SupplierRepository, EventBus]),
    createUseCaseProvider(UpdateSupplier, [SupplierRepository, EventBus]),
    createUseCaseProvider(FindSupplier, [SupplierRepository]),
    createUseCaseProvider(FindAllSuppliers, [SupplierRepository]),
    createUseCaseProvider(SearchSuppliersByCriteria, [SupplierRepository]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers,

    // EVENT SUBSCRIBERS
    ...EventSubscribers
  ],
  exports: [SupplierRepository, CreateSupplier, FindSupplier]
})
export class SupplierModule {}

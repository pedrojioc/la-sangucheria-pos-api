import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { UnitEntity } from '@/contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

// Repositories
import { UnitRepository } from '@/contexts/shared-kernel/unit/domain/repositories/unit.repository'
import { TypeOrmUnitRepository } from '@/contexts/shared-kernel/unit/infrastructure/persistence/typeorm/typeorm-unit.repository'

// Events
import { EventBus } from '@/shared/domain/events'

// Command Handlers
import { CreateUnitCommandHandler } from '@/contexts/shared-kernel/unit/application/create/create-unit.handler'
import { UpdateUnitCommandHandler } from '@/contexts/shared-kernel/unit/application/update/update-unit.handler'
import { DeleteUnitCommandHandler } from '@/contexts/shared-kernel/unit/application/delete/delete-unit.handler'

// Query Handlers
import { FindUnitQueryHandler } from '@/contexts/shared-kernel/unit/application/find/find-unit.handler'
import { FindAllUnitsQueryHandler } from '@/contexts/shared-kernel/unit/application/find-all/find-all-units.handler'

// Use Cases
import { CreateUnit } from '@/contexts/shared-kernel/unit/application/create/create-unit'
import { UpdateUnit } from '@/contexts/shared-kernel/unit/application/update/update-unit'
import { DeleteUnit } from '@/contexts/shared-kernel/unit/application/delete/delete-unit'
import { FindUnit } from '@/contexts/shared-kernel/unit/application/find/find-unit'
import { FindAllUnits } from '@/contexts/shared-kernel/unit/application/find-all/find-all-units'

// Controllers
import { UnitsController } from '@/contexts/shared-kernel/unit/presentation/http/controllers/units.controller'

// Subscribers
import { ReactOnUnitCreated } from '@/contexts/shared-kernel/unit/application/subscribers/react-on-unit-created'

// Utils
import { createUseCaseProvider } from '@/core/utils/createUseCaseProvider'

const CommandHandlers = [
  CreateUnitCommandHandler,
  UpdateUnitCommandHandler,
  DeleteUnitCommandHandler
]

const QueryHandlers = [FindUnitQueryHandler, FindAllUnitsQueryHandler]

const Subscribers = [ReactOnUnitCreated]

@Module({
  imports: [TypeOrmModule.forFeature([UnitEntity])],
  controllers: [UnitsController],
  providers: [
    // REPOSITORIES
    {
      provide: UnitRepository,
      useClass: TypeOrmUnitRepository
    },

    // USE CASES
    createUseCaseProvider(CreateUnit, [UnitRepository, EventBus]),
    createUseCaseProvider(UpdateUnit, [UnitRepository, EventBus]),
    createUseCaseProvider(DeleteUnit, [UnitRepository, EventBus]),
    createUseCaseProvider(FindUnit, [UnitRepository]),
    createUseCaseProvider(FindAllUnits, [UnitRepository]),

    // COMMAND HANDLERS
    ...CommandHandlers,

    // QUERY HANDLERS
    ...QueryHandlers,

    // SUBSCRIBERS
    ...Subscribers
  ],
  exports: [UnitRepository, FindUnit]
})
export class UnitModule {}

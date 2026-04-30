import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EmployeeEntity } from './infrastructure/persistence/typeorm/employee.entity'
import { EmployeeRepository } from './domain/repositories/employee.repository'
import { TypeOrmEmployeeRepository } from './infrastructure/persistence/typeorm/typeorm-employee.repository'
import { EmployeeQueryService } from './application/services/employee-query.service'
import { TypeOrmEmployeeQueryService } from './infrastructure/query-services/typeorm-employee-query.service'
import { EventBus } from '@/shared/domain/events'
import { createProvider } from '@/core/utils/create-provider'
import { UserModule } from '@contexts/iam/user/user.module'
import { RegisterUser } from '@contexts/iam/user/application/register/register-user'

import { CreateEmployee } from './application/create/create-employee'
import { UpdateEmployee } from './application/update/update-employee'
import { DeleteEmployee } from './application/delete/delete-employee'
import { FindEmployee } from './application/find/find-employee'
import { SearchEmployeesByCriteria } from './application/search-by-criteria/search-employees-by-criteria'
import { GrantEmployeeAccess } from './application/grant-access/grant-employee-access'

import { CreateEmployeeHandler } from './application/create/create-employee.handler'
import { UpdateEmployeeHandler } from './application/update/update-employee.handler'
import { DeleteEmployeeHandler } from './application/delete/delete-employee.handler'
import { FindEmployeeHandler } from './application/find/find-employee.handler'
import { SearchEmployeesByCriteriaHandler } from './application/search-by-criteria/search-employees-by-criteria.handler'
import { GrantEmployeeAccessHandler } from './application/grant-access/grant-employee-access.handler'

import { EmployeeController } from './presentation/http/controllers/employee.controller'

const CommandHandlers = [
  CreateEmployeeHandler,
  UpdateEmployeeHandler,
  DeleteEmployeeHandler,
  GrantEmployeeAccessHandler
]
const QueryHandlers = [FindEmployeeHandler, SearchEmployeesByCriteriaHandler]

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeEntity]), UserModule],
  controllers: [EmployeeController],
  providers: [
    { provide: EmployeeRepository, useClass: TypeOrmEmployeeRepository },
    { provide: EmployeeQueryService, useClass: TypeOrmEmployeeQueryService },

    createProvider(CreateEmployee, [EmployeeRepository, EventBus]),
    createProvider(UpdateEmployee, [EmployeeRepository, EventBus]),
    createProvider(DeleteEmployee, [EmployeeRepository]),
    createProvider(FindEmployee, [EmployeeRepository]),
    createProvider(SearchEmployeesByCriteria, [EmployeeQueryService]),
    createProvider(GrantEmployeeAccess, [EmployeeRepository, RegisterUser, EventBus]),

    ...CommandHandlers,
    ...QueryHandlers
  ],
  exports: [EmployeeRepository, FindEmployee]
})
export class EmployeeModule {}

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

import { EmployeeController } from './presentation/http/controllers/employee.controller'

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeEntity]), UserModule],
  controllers: [EmployeeController],
  providers: [
    { provide: EmployeeRepository, useClass: TypeOrmEmployeeRepository },
    { provide: EmployeeQueryService, useClass: TypeOrmEmployeeQueryService },

    createProvider(CreateEmployee, [EmployeeRepository, EventBus]),
    createProvider(UpdateEmployee, [EmployeeRepository, EventBus]),
    createProvider(DeleteEmployee, [EmployeeRepository]),
    createProvider(FindEmployee, [EmployeeQueryService]),
    createProvider(SearchEmployeesByCriteria, [EmployeeQueryService]),
    createProvider(GrantEmployeeAccess, [EmployeeRepository, RegisterUser, EventBus])
  ],
  exports: [EmployeeRepository]
})
export class EmployeeModule {}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoleEntity } from './infrastructure/persistence/typeorm/role.entity'
import { RoleRepository } from './domain/repositories/role.repository'
import { TypeOrmRoleRepository } from './infrastructure/persistence/typeorm/typeorm-role.repository'
import { createProvider } from '@/core/utils/create-provider'

import { CreateRole } from './application/create/create-role'
import { UpdateRole } from './application/update/update-role'
import { DeleteRole } from './application/delete/delete-role'
import { FindRole } from './application/find/find-role'
import { FindAllRoles } from './application/find-all/find-all-roles'

import { CreateRoleHandler } from './application/create/create-role.handler'
import { UpdateRoleHandler } from './application/update/update-role.handler'
import { DeleteRoleHandler } from './application/delete/delete-role.handler'
import { FindRoleHandler } from './application/find/find-role.handler'
import { FindAllRolesHandler } from './application/find-all/find-all-roles.handler'

import { RoleController } from './presentation/http/controllers/role.controller'

const CommandHandlers = [CreateRoleHandler, UpdateRoleHandler, DeleteRoleHandler]
const QueryHandlers = [FindRoleHandler, FindAllRolesHandler]

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity])],
  controllers: [RoleController],
  providers: [
    { provide: RoleRepository, useClass: TypeOrmRoleRepository },
    createProvider(CreateRole, [RoleRepository]),
    createProvider(UpdateRole, [RoleRepository]),
    createProvider(DeleteRole, [RoleRepository]),
    createProvider(FindRole, [RoleRepository]),
    createProvider(FindAllRoles, [RoleRepository]),
    ...CommandHandlers,
    ...QueryHandlers
  ],
  exports: [RoleRepository, FindRole]
})
export class RoleModule {}

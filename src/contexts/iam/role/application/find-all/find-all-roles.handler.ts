import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindAllRolesQuery } from './find-all-roles.query'
import { FindAllRoles } from './find-all-roles'
import { RoleResponse } from '../dto/role.response'

@QueryHandler(FindAllRolesQuery)
export class FindAllRolesHandler implements IQueryHandler<FindAllRolesQuery> {
  constructor(private readonly findAllRoles: FindAllRoles) {}

  async execute(): Promise<RoleResponse[]> {
    const roles = await this.findAllRoles.run()
    return roles.map(RoleResponse.fromDomain)
  }
}

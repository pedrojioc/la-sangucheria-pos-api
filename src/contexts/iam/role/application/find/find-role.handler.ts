import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { FindRoleQuery } from './find-role.query'
import { FindRole } from './find-role'
import { RoleResponse } from '../dto/role.response'

@QueryHandler(FindRoleQuery)
export class FindRoleHandler implements IQueryHandler<FindRoleQuery> {
  constructor(private readonly findRole: FindRole) {}

  async execute(query: FindRoleQuery): Promise<RoleResponse> {
    const role = await this.findRole.run(query.id)
    return RoleResponse.fromDomain(role)
  }
}

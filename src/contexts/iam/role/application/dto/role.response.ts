import { Role } from '../../domain/role'

export class RoleResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null
  ) {}

  static fromDomain(role: Role): RoleResponse {
    const p = role.toPrimitives()
    return new RoleResponse(p.id, p.name, p.description)
  }
}

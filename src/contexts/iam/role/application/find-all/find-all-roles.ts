import { Role } from '../../domain/role'
import { RoleRepository } from '../../domain/repositories/role.repository'

export class FindAllRoles {
  constructor(private readonly repository: RoleRepository) {}

  async run(): Promise<Role[]> {
    return this.repository.searchAll()
  }
}

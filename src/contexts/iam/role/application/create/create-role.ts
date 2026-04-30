import { Role } from '../../domain/role'
import { RoleRepository } from '../../domain/repositories/role.repository'

export class CreateRole {
  constructor(private readonly repository: RoleRepository) {}

  async run(id: string, name: string, description: string | null): Promise<void> {
    const role = Role.create(id, name, description)
    await this.repository.save(role)
  }
}

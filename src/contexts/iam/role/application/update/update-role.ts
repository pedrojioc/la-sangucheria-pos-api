import { RoleRepository } from '../../domain/repositories/role.repository'
import { RoleId } from '../../domain/role-id'
import { RoleNotExist } from '../../domain/exceptions/role-not-exist.exception'

export class UpdateRole {
  constructor(private readonly repository: RoleRepository) {}

  async run(id: string, name: string, description: string | null): Promise<void> {
    const role = await this.repository.search(new RoleId(id))
    if (!role) throw new RoleNotExist(id)
    role.update(name, description)
    await this.repository.save(role)
  }
}

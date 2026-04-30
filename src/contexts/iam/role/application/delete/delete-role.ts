import { RoleRepository } from '../../domain/repositories/role.repository'
import { RoleId } from '../../domain/role-id'
import { RoleNotExist } from '../../domain/exceptions/role-not-exist.exception'

export class DeleteRole {
  constructor(private readonly repository: RoleRepository) {}

  async run(id: string): Promise<void> {
    const role = await this.repository.search(new RoleId(id))
    if (!role) throw new RoleNotExist(id)
    await this.repository.delete(new RoleId(id))
  }
}

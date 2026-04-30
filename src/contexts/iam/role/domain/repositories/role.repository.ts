import { Role } from '../role'
import { RoleId } from '../role-id'

export abstract class RoleRepository {
  abstract save(role: Role): Promise<void>
  abstract search(id: RoleId): Promise<Role | null>
  abstract searchAll(): Promise<Role[]>
  abstract delete(id: RoleId): Promise<void>
}

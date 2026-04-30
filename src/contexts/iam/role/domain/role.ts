import { AggregateRoot } from '@/shared/domain/aggregate-root'
import { RoleId } from './role-id'
import { RoleName } from './role-name'
import { RoleDescription } from './role-description'

export interface RolePrimitives {
  id: string
  name: string
  description: string | null
}

export class Role extends AggregateRoot {
  private constructor(
    public readonly id: RoleId,
    private name: RoleName,
    private description: RoleDescription | null
  ) {
    super()
  }

  static create(id: string, name: string, description: string | null): Role {
    return Role.fromPrimitives({ id, name, description })
  }

  static fromPrimitives(primitives: RolePrimitives): Role {
    return new Role(
      new RoleId(primitives.id),
      new RoleName(primitives.name),
      primitives.description !== null ? new RoleDescription(primitives.description) : null
    )
  }

  update(name: string, description: string | null): void {
    this.name = new RoleName(name)
    this.description = description !== null ? new RoleDescription(description) : null
  }

  toPrimitives(): RolePrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      description: this.description?.value ?? null
    }
  }
}

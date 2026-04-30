import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '@/contexts/iam/shared/decorators/roles.decorator'
import { UserRepository } from '@/contexts/iam/user/domain/repositories/user.repository'
import { UserId } from '@/contexts/iam/user/domain/user-id'
import { RoleRepository } from '@/contexts/iam/role/domain/repositories/role.repository'
import { RoleId } from '@/contexts/iam/role/domain/role-id'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const userId: string | undefined = request.user?.userId

    if (!userId) {
      throw new ForbiddenException('Authentication required')
    }

    const user = await this.userRepository.search(new UserId(userId))
    if (!user) {
      throw new ForbiddenException('User not found')
    }

    const role = await this.roleRepository.search(new RoleId(user.getRoleId()))
    if (!role) {
      throw new ForbiddenException('Role not found')
    }

    const roleName = role.toPrimitives().name
    if (!requiredRoles.includes(roleName)) {
      throw new ForbiddenException(`Required role: ${requiredRoles.join(' or ')}`)
    }

    return true
  }
}

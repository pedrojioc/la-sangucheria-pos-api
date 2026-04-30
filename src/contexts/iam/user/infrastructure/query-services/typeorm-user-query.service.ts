import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from '../persistence/typeorm/user.entity'
import { UserQueryService } from '../../application/services/user-query.service'
import { UserListResponse, EmployeeData, RoleData } from '../../application/dto/user-list.response'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'

@Injectable()
export class TypeOrmUserQueryService implements UserQueryService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<UserListResponse>> {
    const qb = this.repository
      .createQueryBuilder('user')
      .leftJoin('roles', 'role', 'role.id = user.role_id')
      .leftJoin('employees', 'employee', 'employee.user_id = user.id')
      .select([
        'user.id AS id',
        'user.username AS username',
        'user.email AS email',
        'user.full_name AS "fullName"',
        'user.role_id AS "roleId"',
        'role.name AS "roleName"',
        'user.is_active AS "isActive"',
        'user.is_email_verified AS "isEmailVerified"',
        'user.created_at AS "createdAt"',
        'user.last_login_at AS "lastLoginAt"',
        'employee.id AS "employeeId"',
        'employee.first_name AS "employeeFirstName"',
        'employee.last_name AS "employeeLastName"',
        'employee.position_id AS "employeePositionId"'
      ])

    const converter = new TypeOrmCriteriaConverter()
    converter.convert(qb, criteria, 'user')

    const [raws, total] = await Promise.all([qb.getRawMany(), qb.getCount()])

    const items: UserListResponse[] = raws.map(raw => {
      const role: RoleData = { id: raw.roleId, name: raw.roleName }
      const employee: EmployeeData | null = raw.employeeId
        ? {
            id: raw.employeeId,
            firstName: raw.employeeFirstName,
            lastName: raw.employeeLastName,
            positionId: raw.employeePositionId ?? null
          }
        : null

      return new UserListResponse(
        raw.id,
        raw.username,
        raw.email,
        raw.fullName ?? null,
        role,
        raw.isActive,
        raw.isEmailVerified,
        raw.createdAt,
        raw.lastLoginAt ?? null,
        employee
      )
    })

    return PaginatedResult.create(
      items,
      total,
      criteria.pagination?.page || 1,
      criteria.pagination?.pageSize || 20
    )
  }
}

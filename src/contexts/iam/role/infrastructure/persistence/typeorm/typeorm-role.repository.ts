import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/role'
import { RoleId } from '../../../domain/role-id'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { RoleEntity } from './role.entity'

@Injectable()
export class TypeOrmRoleRepository
  extends TransactionalRepository<RoleEntity>
  implements RoleRepository
{
  constructor(
    @InjectRepository(RoleEntity)
    repository: Repository<RoleEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(role: Role): Promise<void> {
    await this.repo.save(this.repo.create(role.toPrimitives()))
  }

  async search(id: RoleId): Promise<Role | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    return entity ? Role.fromPrimitives(entity) : null
  }

  async searchAll(): Promise<Role[]> {
    const entities = await this.repo.find({ order: { name: 'ASC' } })
    return entities.map(Role.fromPrimitives)
  }

  async delete(id: RoleId): Promise<void> {
    await this.repo.delete({ id: id.value })
  }
}

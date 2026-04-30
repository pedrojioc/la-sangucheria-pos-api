import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { RoleRepository } from '../../../domain/repositories/role.repository'
import { Role } from '../../../domain/role'
import { RoleId } from '../../../domain/role-id'
import { RoleEntity } from './role.entity'

@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly repository: Repository<RoleEntity>
  ) {}

  async save(role: Role): Promise<void> {
    await this.repository.save(this.repository.create(role.toPrimitives()))
  }

  async search(id: RoleId): Promise<Role | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    return entity ? Role.fromPrimitives(entity) : null
  }

  async searchAll(): Promise<Role[]> {
    const entities = await this.repository.find({ order: { name: 'ASC' } })
    return entities.map(Role.fromPrimitives)
  }

  async delete(id: RoleId): Promise<void> {
    await this.repository.delete({ id: id.value })
  }
}

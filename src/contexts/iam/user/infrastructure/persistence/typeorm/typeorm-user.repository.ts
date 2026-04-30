import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UserEntity } from './user.entity'
import { UserRepository } from '../../../domain/repositories/user.repository'
import { User } from '../../../domain/user'
import { UserId } from '../../../domain/user-id'
import { Username } from '../../../domain/username'
import { UserEmail } from '../../../domain/user-email'

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>
  ) {}

  async save(user: User): Promise<void> {
    const primitives = user.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async search(id: UserId): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    return entity ? User.fromPrimitives(entity) : null
  }

  async searchByUsername(username: Username): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { username: username.value } })
    return entity ? User.fromPrimitives(entity) : null
  }

  async searchByEmail(email: UserEmail): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email: email.value } })
    return entity ? User.fromPrimitives(entity) : null
  }

  async searchAll(): Promise<User[]> {
    const entities = await this.repository.find()
    return entities.map(e => User.fromPrimitives(e))
  }

  async existsByUsername(username: Username): Promise<boolean> {
    const count = await this.repository.count({ where: { username: username.value } })
    return count > 0
  }

  async existsByEmail(email: UserEmail): Promise<boolean> {
    const count = await this.repository.count({ where: { email: email.value } })
    return count > 0
  }
}

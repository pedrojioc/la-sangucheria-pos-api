import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PositionRepository } from '../../../domain/repositories/position.repository'
import { Position } from '../../../domain/position'
import { PositionId } from '../../../domain/position-id'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { PositionEntity } from './position.entity'

@Injectable()
export class TypeOrmPositionRepository
  extends TransactionalRepository<PositionEntity>
  implements PositionRepository
{
  constructor(
    @InjectRepository(PositionEntity)
    repository: Repository<PositionEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(position: Position): Promise<void> {
    await this.repo.save(this.repo.create(position.toPrimitives()))
  }

  async search(id: PositionId): Promise<Position | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    return entity ? Position.fromPrimitives(entity) : null
  }

  async searchAll(): Promise<Position[]> {
    const entities = await this.repo.find({ order: { name: 'ASC' } })
    return entities.map(Position.fromPrimitives)
  }

  async delete(id: PositionId): Promise<void> {
    await this.repo.delete({ id: id.value })
  }
}

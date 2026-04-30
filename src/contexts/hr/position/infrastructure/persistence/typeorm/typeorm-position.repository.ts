import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PositionRepository } from '../../../domain/repositories/position.repository'
import { Position } from '../../../domain/position'
import { PositionId } from '../../../domain/position-id'
import { PositionEntity } from './position.entity'

@Injectable()
export class TypeOrmPositionRepository implements PositionRepository {
  constructor(
    @InjectRepository(PositionEntity)
    private readonly repository: Repository<PositionEntity>
  ) {}

  async save(position: Position): Promise<void> {
    await this.repository.save(this.repository.create(position.toPrimitives()))
  }

  async search(id: PositionId): Promise<Position | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    return entity ? Position.fromPrimitives(entity) : null
  }

  async searchAll(): Promise<Position[]> {
    const entities = await this.repository.find({ order: { name: 'ASC' } })
    return entities.map(Position.fromPrimitives)
  }

  async delete(id: PositionId): Promise<void> {
    await this.repository.delete({ id: id.value })
  }
}

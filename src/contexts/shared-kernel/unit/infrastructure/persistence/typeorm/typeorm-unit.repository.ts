import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UnitEntity } from './unit.entity'
import { UnitRepository } from '../../../domain/repositories/unit.repository'
import { Unit } from '../../../domain/unit'
import { UnitId } from '../../../domain/unit-id'

@Injectable()
export class TypeOrmUnitRepository implements UnitRepository {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly repository: Repository<UnitEntity>
  ) {}

  async save(unit: Unit): Promise<void> {
    const primitives = unit.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async findById(id: UnitId): Promise<Unit | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })

    if (!entity) {
      return null
    }

    return Unit.fromPrimitives({
      id: entity.id,
      name: entity.name,
      symbol: entity.symbol,
      type: entity.type as any,
      isActive: entity.isActive
    })
  }

  async findAll(): Promise<Unit[]> {
    const entities = await this.repository.find({ order: { name: 'ASC' } })

    return entities.map(entity =>
      Unit.fromPrimitives({
        id: entity.id,
        name: entity.name,
        symbol: entity.symbol,
        type: entity.type as any,
        isActive: entity.isActive
      })
    )
  }

  async delete(id: UnitId): Promise<void> {
    await this.repository.delete({ id: id.value })
  }
}

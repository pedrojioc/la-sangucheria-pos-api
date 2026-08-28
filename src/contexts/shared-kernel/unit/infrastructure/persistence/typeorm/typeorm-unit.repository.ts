import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UnitEntity } from './unit.entity'
import { UnitRepository } from '../../../domain/repositories/unit.repository'
import { Unit } from '../../../domain/unit'
import { UnitId } from '../../../domain/unit-id'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

@Injectable()
export class TypeOrmUnitRepository
  extends TransactionalRepository<UnitEntity>
  implements UnitRepository
{
  constructor(
    @InjectRepository(UnitEntity)
    repository: Repository<UnitEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(unit: Unit): Promise<void> {
    const primitives = unit.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async findById(id: UnitId): Promise<Unit | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })

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
    const entities = await this.repo.find({ order: { name: 'ASC' } })

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
    await this.repo.delete({ id: id.value })
  }
}

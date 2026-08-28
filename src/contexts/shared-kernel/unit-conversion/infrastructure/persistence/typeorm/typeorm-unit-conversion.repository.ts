import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UnitConversionRepository } from '@/contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { UnitConversion } from '@/contexts/shared-kernel/unit-conversion/domain/unit-conversion'
import { UnitConversionId } from '@/contexts/shared-kernel/unit-conversion/domain/unit-conversion-id'
import { TransactionalRepository } from '@shared/infrastructure/persistence/transactional-repository'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitConversionEntity } from './unit-conversion.entity'

@Injectable()
export class TypeOrmUnitConversionRepository
  extends TransactionalRepository<UnitConversionEntity>
  implements UnitConversionRepository
{
  constructor(
    @InjectRepository(UnitConversionEntity)
    repository: Repository<UnitConversionEntity>,
    uow: UnitOfWorkContextHolder
  ) {
    super(repository, uow)
  }

  async save(conversion: UnitConversion): Promise<void> {
    const primitives = conversion.toPrimitives()
    const entity = this.repo.create(primitives)
    await this.repo.save(entity)
  }

  async search(id: UnitConversionId): Promise<UnitConversion | null> {
    const entity = await this.repo.findOne({ where: { id: id.value } })
    if (!entity) return null
    return UnitConversion.fromPrimitives(entity)
  }

  async findByUnits(fromUnitId: string, toUnitId: string): Promise<UnitConversion | null> {
    // Buscar conversión directa: from → to
    const direct = await this.repo.findOne({
      where: { fromUnitId, toUnitId }
    })

    if (direct) return UnitConversion.fromPrimitives(direct)

    // Buscar conversión inversa: to → from, e invertir el factor
    const inverse = await this.repo.findOne({
      where: { fromUnitId: toUnitId, toUnitId: fromUnitId }
    })

    if (!inverse) return null

    return UnitConversion.fromPrimitives({
      ...inverse,
      fromUnitId,
      toUnitId,
      factor: 1 / inverse.factor
    })
  }

  async findByUnit(unitId: string): Promise<UnitConversion[]> {
    const entities = await this.repo
      .createQueryBuilder('uc')
      .where('uc.fromUnitId = :unitId OR uc.toUnitId = :unitId', { unitId })
      .orderBy('uc.fromUnitId', 'ASC')
      .getMany()

    return entities.map(entity => UnitConversion.fromPrimitives(entity))
  }

  async findByFromUnit(fromUnitId: string): Promise<UnitConversion[]> {
    const entities = await this.repo.find({
      where: { fromUnitId },
      order: { toUnitId: 'ASC' }
    })

    return entities.map(entity => UnitConversion.fromPrimitives(entity))
  }

  async findByToUnit(toUnitId: string): Promise<UnitConversion[]> {
    const entities = await this.repo.find({
      where: { toUnitId },
      order: { fromUnitId: 'ASC' }
    })

    return entities.map(entity => UnitConversion.fromPrimitives(entity))
  }

  async searchAll(): Promise<UnitConversion[]> {
    const entities = await this.repo.find({
      order: { fromUnitId: 'ASC', toUnitId: 'ASC' }
    })

    return entities.map(entity => UnitConversion.fromPrimitives(entity))
  }
}

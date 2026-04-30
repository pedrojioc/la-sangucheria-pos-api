import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UnitConversionRepository } from '@/contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { UnitConversion } from '@/contexts/shared-kernel/unit-conversion/domain/unit-conversion'
import { UnitConversionId } from '@/contexts/shared-kernel/unit-conversion/domain/unit-conversion-id'
import { UnitConversionEntity } from './unit-conversion.entity'

@Injectable()
export class TypeOrmUnitConversionRepository extends UnitConversionRepository {
  constructor(
    @InjectRepository(UnitConversionEntity)
    private readonly repository: Repository<UnitConversionEntity>
  ) {
    super()
  }

  async save(conversion: UnitConversion): Promise<void> {
    const primitives = conversion.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async search(id: UnitConversionId): Promise<UnitConversion | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    if (!entity) return null
    return UnitConversion.fromPrimitives(entity)
  }

  async findByUnits(fromUnitId: string, toUnitId: string): Promise<UnitConversion | null> {
    // Buscar conversión directa: from → to
    const direct = await this.repository.findOne({
      where: { fromUnitId, toUnitId }
    })

    if (direct) return UnitConversion.fromPrimitives(direct)

    // Buscar conversión inversa: to → from, e invertir el factor
    const inverse = await this.repository.findOne({
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

  async findByFromUnit(fromUnitId: string): Promise<UnitConversion[]> {
    const entities = await this.repository.find({
      where: { fromUnitId },
      order: { toUnitId: 'ASC' }
    })

    return entities.map(entity => UnitConversion.fromPrimitives(entity))
  }

  async findByToUnit(toUnitId: string): Promise<UnitConversion[]> {
    const entities = await this.repository.find({
      where: { toUnitId },
      order: { fromUnitId: 'ASC' }
    })

    return entities.map(entity => UnitConversion.fromPrimitives(entity))
  }

  async searchAll(): Promise<UnitConversion[]> {
    const entities = await this.repository.find({
      order: { fromUnitId: 'ASC', toUnitId: 'ASC' }
    })

    return entities.map(entity => UnitConversion.fromPrimitives(entity))
  }
}

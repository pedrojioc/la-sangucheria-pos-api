import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { UnitQueryService } from '../../application/services/unit-query.service'
import { UnitListItem } from '../../application/dto/unit-list-item'
import { UnitConversionListItem, UnitRef } from '../../application/dto/unit-conversion-list-item'
import { UnitEntity } from '../persistence/typeorm/unit.entity'
import { UnitConversionEntity } from '@/contexts/shared-kernel/unit-conversion/infrastructure/persistence/typeorm/unit-conversion.entity'

@Injectable()
export class TypeOrmUnitQueryService implements UnitQueryService {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
    @InjectRepository(UnitConversionEntity)
    private readonly conversionRepository: Repository<UnitConversionEntity>
  ) {}

  async findAll(): Promise<UnitListItem[]> {
    const units = await this.unitRepository.find({ order: { name: 'ASC' } })
    return units.map(u => new UnitListItem(u.id, u.name, u.symbol, u.type, u.isActive, []))
  }

  async findConversionsByUnit(unitId: string): Promise<UnitConversionListItem[]> {
    const entities = await this.conversionRepository
      .createQueryBuilder('uc')
      .innerJoinAndSelect('uc.fromUnit', 'fu')
      .innerJoinAndSelect('uc.toUnit', 'tu')
      .where('uc.fromUnitId = :unitId OR uc.toUnitId = :unitId', { unitId })
      .orderBy('fu.name', 'ASC')
      .getMany()

    return entities.map(c => {
      const fromUnit: UnitRef = {
        id: c.fromUnitId,
        name: c.fromUnit.name,
        symbol: c.fromUnit.symbol
      }
      const toUnit: UnitRef = { id: c.toUnitId, name: c.toUnit.name, symbol: c.toUnit.symbol }
      return new UnitConversionListItem(c.id, fromUnit, toUnit, Number(c.factor), c.description)
    })
  }
}

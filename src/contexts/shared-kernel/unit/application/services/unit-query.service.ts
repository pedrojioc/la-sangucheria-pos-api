import { UnitListItem } from '../dto/unit-list-item'
import { UnitConversionListItem } from '../dto/unit-conversion-list-item'

export abstract class UnitQueryService {
  abstract findAll(): Promise<UnitListItem[]>
  abstract findConversionsByUnit(unitId: string): Promise<UnitConversionListItem[]>
}

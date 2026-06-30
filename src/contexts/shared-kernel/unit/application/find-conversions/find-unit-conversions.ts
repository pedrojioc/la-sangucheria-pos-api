import { UnitQueryService } from '../services/unit-query.service'
import { UnitConversionListItem } from '../dto/unit-conversion-list-item'

export class FindUnitConversions {
  constructor(private readonly queryService: UnitQueryService) {}

  async run(unitId: string): Promise<UnitConversionListItem[]> {
    return this.queryService.findConversionsByUnit(unitId)
  }
}

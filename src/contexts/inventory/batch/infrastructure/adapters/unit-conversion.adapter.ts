import { Injectable } from '@nestjs/common'
import { GetConversionFactor } from '@contexts/shared-kernel/unit-conversion/application/get-conversion-factor/get-conversion-factor'
import { UnitConversionPort } from '../../application/ports/unit-conversion.port'

@Injectable()
export class SharedKernelUnitConversionAdapter extends UnitConversionPort {
  constructor(private readonly getConversionFactor: GetConversionFactor) {
    super()
  }

  async getFactor(fromUnitId: string, toUnitId: string): Promise<number> {
    return this.getConversionFactor.run(fromUnitId, toUnitId)
  }
}

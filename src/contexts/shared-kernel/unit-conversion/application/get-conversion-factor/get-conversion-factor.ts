import { UnitConversionRepository } from '../../domain/repositories/unit-conversion.repository'
import { UnitConversionNotFound } from '../../domain/exceptions/unit-conversion-not-found.exception'

/**
 * GetConversionFactor - Query Use Case
 *
 * Open Host Service exposing the raw conversion factor between two units,
 * preserving today's direct-lookup + inverse-rule-synthesis behavior of
 * UnitConversionRepository.findByUnits (see ADR-1 in the design for
 * sdd/fix-register-item-reception-port — do not replace this with
 * ConvertQuantity's searchAll()-based path, that would drop inverse-rule
 * synthesis and silently break single-direction conversion rules).
 *
 * Returns a primitive number, never a UnitConversion aggregate or
 * ConversionFactor value object.
 */
export class GetConversionFactor {
  constructor(private readonly conversionRepository: UnitConversionRepository) {}

  async run(fromUnitId: string, toUnitId: string): Promise<number> {
    const rule = await this.conversionRepository.findByUnits(fromUnitId, toUnitId)

    if (!rule) {
      throw new UnitConversionNotFound(fromUnitId, toUnitId)
    }

    return rule.getFactor().value
  }
}

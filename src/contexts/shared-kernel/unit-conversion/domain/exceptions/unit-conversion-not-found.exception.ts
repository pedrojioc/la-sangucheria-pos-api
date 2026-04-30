import { DomainException } from '@/shared/domain/exceptions/domain.exception'

/**
 * Exception thrown when no conversion rule exists between two units.
 *
 * This typically happens when:
 * - Trying to convert between incompatible unit types (e.g., kg to liters)
 * - The conversion rule hasn't been registered in the system
 */
export class UnitConversionNotFound extends DomainException {
  constructor(fromUnitId: string, toUnitId: string) {
    super(`No conversion rule found from unit '${fromUnitId}' to unit '${toUnitId}'`)
  }
}

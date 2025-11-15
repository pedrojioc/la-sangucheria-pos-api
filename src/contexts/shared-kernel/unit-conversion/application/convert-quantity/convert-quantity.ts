import { UnitConversionRepository } from '@/contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { UnitConversionService } from '@/contexts/shared-kernel/unit-conversion/domain/services/unit-conversion.service'
import { Quantity } from '@/shared/domain/value-objects/quantity'

/**
 * ConvertQuantity - Query Use Case
 *
 * Convierte una cantidad de una unidad a otra.
 * Requiere que exista una regla de conversión directa.
 *
 * Ejemplo:
 * Input: 2.5kg
 * Output: 2500g
 */
export class ConvertQuantity {
  constructor(
    private readonly conversionRepository: UnitConversionRepository,
    private readonly conversionService: UnitConversionService
  ) {}

  async run(quantity: number, fromUnitId: string, toUnitId: string): Promise<Quantity> {
    // Obtener todas las reglas de conversión
    // TODO: Optimizar para obtener solo la regla necesaria
    const allRules = await this.conversionRepository.searchAll()

    const inputQuantity = new Quantity(quantity, fromUnitId)

    return this.conversionService.convert(inputQuantity, toUnitId, allRules)
  }
}

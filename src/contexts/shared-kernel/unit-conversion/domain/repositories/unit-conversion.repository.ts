import { UnitConversion } from '../unit-conversion'
import { UnitConversionId } from '../unit-conversion-id'

export abstract class UnitConversionRepository {
  abstract save(conversion: UnitConversion): Promise<void>

  abstract search(id: UnitConversionId): Promise<UnitConversion | null>

  /**
   * Busca conversión directa entre dos unidades
   */
  abstract findByUnits(fromUnitId: string, toUnitId: string): Promise<UnitConversion | null>

  /**
   * Busca todas las conversiones donde la unidad aparece como origen o destino
   */
  abstract findByUnit(unitId: string): Promise<UnitConversion[]>

  /**
   * Busca todas las conversiones desde una unidad específica
   * Útil para saber a qué unidades se puede convertir
   */
  abstract findByFromUnit(fromUnitId: string): Promise<UnitConversion[]>

  /**
   * Busca todas las conversiones hacia una unidad específica
   */
  abstract findByToUnit(toUnitId: string): Promise<UnitConversion[]>

  abstract searchAll(): Promise<UnitConversion[]>
}

import { Quantity } from '@/shared/domain/value-objects/quantity'
import { UnitConversion } from '../unit-conversion'

export interface ConversionResult {
  originalQuantity: number
  originalUnitId: string
  convertedQuantity: number
  convertedUnitId: string
  conversionFactor: number
}

/**
 * UnitConversionService - Domain Service
 *
 * Servicio de dominio para conversión de cantidades entre unidades.
 * No es un agregado porque coordina múltiples conversiones.
 *
 * Responsabilidades:
 * - Convertir Quantity de una unidad a otra
 * - Buscar reglas de conversión
 * - Manejar conversiones directas e indirectas (futuro: multi-hop)
 *
 * IMPORTANTE: Para simplicidad inicial, solo soporta conversiones directas.
 * Si no existe conversión directa, lanza error.
 */
export class UnitConversionService {
  /**
   * Convierte una Quantity a otra unidad
   * Requiere que exista una regla de conversión directa
   */
  convert(quantity: Quantity, targetUnitId: string, conversionRules: UnitConversion[]): Quantity {
    // Si ya está en la unidad correcta, retornar tal cual
    if (quantity.unitId === targetUnitId) {
      return quantity
    }

    // Buscar regla de conversión directa
    const rule = conversionRules.find(
      r => r.fromUnitId === quantity.unitId && r.toUnitId === targetUnitId
    )

    if (!rule) {
      throw new Error(`No conversion rule found from ${quantity.unitId} to ${targetUnitId}`)
    }

    // Aplicar conversión
    const convertedValue = rule.convert(quantity.value)

    return new Quantity(convertedValue, targetUnitId)
  }

  /**
   * Verifica si es posible convertir entre dos unidades
   */
  canConvert(fromUnitId: string, toUnitId: string, conversionRules: UnitConversion[]): boolean {
    if (fromUnitId === toUnitId) return true

    return conversionRules.some(r => r.fromUnitId === fromUnitId && r.toUnitId === toUnitId)
  }

  /**
   * Obtiene información detallada de la conversión sin aplicarla
   */
  getConversionInfo(
    quantity: number,
    fromUnitId: string,
    toUnitId: string,
    conversionRules: UnitConversion[]
  ): ConversionResult {
    if (fromUnitId === toUnitId) {
      return {
        originalQuantity: quantity,
        originalUnitId: fromUnitId,
        convertedQuantity: quantity,
        convertedUnitId: toUnitId,
        conversionFactor: 1
      }
    }

    const rule = conversionRules.find(r => r.fromUnitId === fromUnitId && r.toUnitId === toUnitId)

    if (!rule) {
      throw new Error(`No conversion rule found from ${fromUnitId} to ${toUnitId}`)
    }

    return {
      originalQuantity: quantity,
      originalUnitId: fromUnitId,
      convertedQuantity: rule.convert(quantity),
      convertedUnitId: toUnitId,
      conversionFactor: rule.getFactor().value
    }
  }
}

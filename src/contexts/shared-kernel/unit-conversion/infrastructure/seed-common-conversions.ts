import { UnitConversion } from '../domain/unit-conversion'
import { Uuid } from '@/shared/domain/value-objects/uuid'

/**
 * Seed de conversiones comunes
 *
 * IMPORTANTE: Estas son conversiones direccionales.
 * Para conversión bidireccional, se crean dos registros.
 *
 * Ejemplos:
 * - kg → g (factor: 1000)
 * - g → kg (factor: 0.001)
 */

export interface CommonConversionSeed {
  fromUnitName: string
  toUnitName: string
  factor: number
  description: string
}

/**
 * Conversiones de peso (masa)
 */
export const weightConversions: CommonConversionSeed[] = [
  // Kilogramos
  {
    fromUnitName: 'kilogramo',
    toUnitName: 'gramo',
    factor: 1000,
    description: '1 kilogramo = 1000 gramos'
  },
  {
    fromUnitName: 'gramo',
    toUnitName: 'kilogramo',
    factor: 0.001,
    description: '1 gramo = 0.001 kilogramos'
  },
  // Libras
  {
    fromUnitName: 'libra',
    toUnitName: 'kilogramo',
    factor: 0.453592,
    description: '1 libra = 0.453592 kilogramos'
  },
  {
    fromUnitName: 'kilogramo',
    toUnitName: 'libra',
    factor: 2.20462,
    description: '1 kilogramo = 2.20462 libras'
  },
  {
    fromUnitName: 'libra',
    toUnitName: 'gramo',
    factor: 453.592,
    description: '1 libra = 453.592 gramos'
  },
  {
    fromUnitName: 'gramo',
    toUnitName: 'libra',
    factor: 0.00220462,
    description: '1 gramo = 0.00220462 libras'
  }
]

/**
 * Conversiones de volumen
 */
export const volumeConversions: CommonConversionSeed[] = [
  // Litros
  {
    fromUnitName: 'litro',
    toUnitName: 'mililitro',
    factor: 1000,
    description: '1 litro = 1000 mililitros'
  },
  {
    fromUnitName: 'mililitro',
    toUnitName: 'litro',
    factor: 0.001,
    description: '1 mililitro = 0.001 litros'
  },
  // Galones (US)
  {
    fromUnitName: 'galon',
    toUnitName: 'litro',
    factor: 3.78541,
    description: '1 galón (US) = 3.78541 litros'
  },
  {
    fromUnitName: 'litro',
    toUnitName: 'galon',
    factor: 0.264172,
    description: '1 litro = 0.264172 galones (US)'
  }
]

/**
 * Conversiones de cantidad (conteo)
 */
export const countConversions: CommonConversionSeed[] = [
  // Docenas
  {
    fromUnitName: 'docena',
    toUnitName: 'unidad',
    factor: 12,
    description: '1 docena = 12 unidades'
  },
  {
    fromUnitName: 'unidad',
    toUnitName: 'docena',
    factor: 0.083333,
    description: '1 unidad = 0.083333 docenas'
  }
]

export const allCommonConversions: CommonConversionSeed[] = [
  ...weightConversions,
  ...volumeConversions,
  ...countConversions
]

/**
 * Crea conversiones de seed con IDs generados
 * NOTA: Requiere que las unidades ya existan en la base de datos
 */
export function createConversionSeeds(unitIdMap: Map<string, string>): UnitConversion[] {
  const conversions: UnitConversion[] = []

  for (const seed of allCommonConversions) {
    const fromUnitId = unitIdMap.get(seed.fromUnitName)
    const toUnitId = unitIdMap.get(seed.toUnitName)

    if (!fromUnitId || !toUnitId) {
      console.warn(`Skipping conversion ${seed.fromUnitName} → ${seed.toUnitName}: unit not found`)
      continue
    }

    const conversion = UnitConversion.create(
      Uuid.random().value,
      fromUnitId,
      toUnitId,
      seed.factor,
      seed.description
    )

    conversions.push(conversion)
  }

  return conversions
}

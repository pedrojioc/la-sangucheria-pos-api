import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { Seeder } from './seeder.interface'
import { UnitEntity } from '@contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'
import { UnitConversionEntity } from '@contexts/shared-kernel/unit-conversion/infrastructure/persistence/typeorm/unit-conversion.entity'

export class UnitConversionSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const conversionRepo = dataSource.getRepository(UnitConversionEntity)
    const unitRepo = dataSource.getRepository(UnitEntity)

    // Check if conversions already exist
    const count = await conversionRepo.count()
    if (count > 0) {
      console.log('⏭️  Unit conversions already seeded, skipping...')
      return
    }

    // Get units by symbol for easy reference
    const units = await unitRepo.find()
    const unitMap = new Map(units.map(u => [u.symbol, u]))

    const conversions: Partial<UnitConversionEntity>[] = [
      // Weight conversions
      {
        id: uuid(),
        fromUnitId: unitMap.get('kg')!.id,
        toUnitId: unitMap.get('g')!.id,
        factor: 1000,
        description: '1 kg = 1000 g'
      },
      {
        id: uuid(),
        fromUnitId: unitMap.get('g')!.id,
        toUnitId: unitMap.get('mg')!.id,
        factor: 1000,
        description: '1 g = 1000 mg'
      },
      {
        id: uuid(),
        fromUnitId: unitMap.get('kg')!.id,
        toUnitId: unitMap.get('lb')!.id,
        factor: 2.20462,
        description: '1 kg = 2.20462 lb'
      },
      {
        id: uuid(),
        fromUnitId: unitMap.get('lb')!.id,
        toUnitId: unitMap.get('oz')!.id,
        factor: 16,
        description: '1 lb = 16 oz'
      },
      {
        id: uuid(),
        fromUnitId: unitMap.get('lb')!.id,
        toUnitId: unitMap.get('g')!.id,
        factor: 453.592,
        description: '1 lb = 453.592 g'
      },

      // Volume conversions
      {
        id: uuid(),
        fromUnitId: unitMap.get('L')!.id,
        toUnitId: unitMap.get('ml')!.id,
        factor: 1000,
        description: '1 L = 1000 ml'
      },
      {
        id: uuid(),
        fromUnitId: unitMap.get('gal')!.id,
        toUnitId: unitMap.get('L')!.id,
        factor: 3.78541,
        description: '1 gal = 3.78541 L'
      },
      {
        id: uuid(),
        fromUnitId: unitMap.get('taza')!.id,
        toUnitId: unitMap.get('ml')!.id,
        factor: 240,
        description: '1 taza = 240 ml'
      },
      {
        id: uuid(),
        fromUnitId: unitMap.get('cda')!.id,
        toUnitId: unitMap.get('ml')!.id,
        factor: 15,
        description: '1 cucharada = 15 ml'
      },
      {
        id: uuid(),
        fromUnitId: unitMap.get('cdta')!.id,
        toUnitId: unitMap.get('ml')!.id,
        factor: 5,
        description: '1 cucharadita = 5 ml'
      },

      // Unit count conversions
      {
        id: uuid(),
        fromUnitId: unitMap.get('doc')!.id,
        toUnitId: unitMap.get('un')!.id,
        factor: 12,
        description: '1 docena = 12 unidades'
      }
    ]

    await conversionRepo.save(conversions)

    console.log(`✅ Seeded ${conversions.length} unit conversions`)
  }
}

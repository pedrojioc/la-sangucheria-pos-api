import { DataSource } from 'typeorm'
import { v4 as uuid } from 'uuid'
import { Seeder } from './seeder.interface'
import { UnitEntity } from '@contexts/shared-kernel/unit/infrastructure/persistence/typeorm/unit.entity'

export class UnitSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const repository = dataSource.getRepository(UnitEntity)

    // Check if units already exist
    const count = await repository.count()
    if (count > 0) {
      console.log('⏭️  Units already seeded, skipping...')
      return
    }

    const units: Partial<UnitEntity>[] = [
      // Weight units
      { id: uuid(), name: 'Kilogramo', symbol: 'kg', type: 'weight', isActive: true },
      { id: uuid(), name: 'Gramo', symbol: 'g', type: 'weight', isActive: true },
      { id: uuid(), name: 'Miligramo', symbol: 'mg', type: 'weight', isActive: true },
      { id: uuid(), name: 'Libra', symbol: 'lb', type: 'weight', isActive: true },
      { id: uuid(), name: 'Onza', symbol: 'oz', type: 'weight', isActive: true },

      // Volume units
      { id: uuid(), name: 'Litro', symbol: 'L', type: 'volume', isActive: true },
      { id: uuid(), name: 'Mililitro', symbol: 'ml', type: 'volume', isActive: true },
      { id: uuid(), name: 'Galón', symbol: 'gal', type: 'volume', isActive: true },
      { id: uuid(), name: 'Taza', symbol: 'taza', type: 'volume', isActive: true },
      {
        id: uuid(),
        name: 'Cucharada',
        symbol: 'cda',
        type: 'volume',
        isActive: true
      },
      {
        id: uuid(),
        name: 'Cucharadita',
        symbol: 'cdta',
        type: 'volume',
        isActive: true
      },

      // Unit counts
      { id: uuid(), name: 'Unidad', symbol: 'un', type: 'unit', isActive: true },
      { id: uuid(), name: 'Docena', symbol: 'doc', type: 'unit', isActive: true },
      { id: uuid(), name: 'Paquete', symbol: 'paq', type: 'unit', isActive: true },
      { id: uuid(), name: 'Caja', symbol: 'caja', type: 'unit', isActive: true },
      { id: uuid(), name: 'Bolsa', symbol: 'bolsa', type: 'unit', isActive: true }
    ]

    await repository.save(units)

    console.log(`✅ Seeded ${units.length} units`)
  }
}

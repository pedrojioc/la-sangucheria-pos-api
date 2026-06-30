import { faker } from '@faker-js/faker'
import { Table, TablePrimitives } from '@contexts/restaurant/table/domain/table'
import { TableStatus } from '@contexts/restaurant/table/domain/table-status'
import { TableShape } from '@contexts/restaurant/table/domain/table-shape'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class TableMother {
  static create(params: Partial<TablePrimitives> = {}): Table {
    const primitives: TablePrimitives = {
      id: params.id ?? UuidMother.random(),
      number: params.number ?? faker.number.int({ min: 1, max: 50 }).toString(),
      capacity: params.capacity ?? faker.number.int({ min: 1, max: 10 }),
      status: params.status ?? TableStatus.AVAILABLE,
      shape: params.shape ?? TableShape.SQUARE,
      currentOrderId: params.currentOrderId !== undefined ? params.currentOrderId : null,
      zoneId: params.zoneId !== undefined ? params.zoneId : null,
      positionX: params.positionX !== undefined ? params.positionX : null,
      positionY: params.positionY !== undefined ? params.positionY : null,
      rotation: params.rotation ?? 0
    }
    return Table.fromPrimitives(primitives)
  }

  static random(): Table {
    return this.create()
  }

  static available(): Table {
    return this.create({ status: TableStatus.AVAILABLE, currentOrderId: null })
  }

  static occupied(): Table {
    return this.create({ status: TableStatus.OCCUPIED, currentOrderId: UuidMother.random() })
  }

  static inactive(): Table {
    return this.create({ status: TableStatus.INACTIVE, currentOrderId: null })
  }

  static withNumber(number: string): Table {
    return this.create({ number })
  }

  static mesa1(): Table {
    return this.create({ number: '1', capacity: 4, status: TableStatus.AVAILABLE })
  }

  static terraza(): Table {
    return this.create({ number: 'Terraza 1', capacity: 6, status: TableStatus.AVAILABLE })
  }
}

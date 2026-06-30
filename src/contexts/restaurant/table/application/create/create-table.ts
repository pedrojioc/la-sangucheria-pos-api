import { TableRepository } from '../../domain/repositories/table.repository'
import { EventBus } from '@shared/domain/events'
import { Table } from '../../domain/table'
import { TableShape } from '../../domain/table-shape'
import { TableNumberAlreadyExists } from '../../domain/exceptions/table-number-already-exists.exception'

export class CreateTable {
  constructor(
    private readonly repository: TableRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(
    id: string,
    number: string,
    capacity: number,
    shape: TableShape,
    zoneId?: string | null,
    positionX?: number | null,
    positionY?: number | null,
    rotation?: number
  ): Promise<void> {
    const existing = await this.repository.searchByNumber(number)
    if (existing) throw new TableNumberAlreadyExists(number)

    const table = Table.create(id, number, capacity, shape, zoneId, positionX, positionY, rotation)
    await this.repository.save(table)
    await this.eventBus.publish(table.pullDomainEvents())
  }
}

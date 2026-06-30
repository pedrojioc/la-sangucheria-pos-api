import { TableRepository } from '../../domain/repositories/table.repository'
import { EventBus } from '@shared/domain/events'
import { FindTable } from '../find/find-table'
import { TableShape } from '../../domain/table-shape'
import { TableNumberAlreadyExists } from '../../domain/exceptions/table-number-already-exists.exception'

export class UpdateTable {
  constructor(
    private readonly repository: TableRepository,
    private readonly eventBus: EventBus,
    private readonly findTable: FindTable
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
    const existing = await this.findTable.run(id)

    if (existing.getNumber() !== number) {
      const conflict = await this.repository.searchByNumber(number)
      if (conflict) throw new TableNumberAlreadyExists(number)
    }

    const updated = existing.update(number, capacity, shape, zoneId, positionX, positionY, rotation)
    await this.repository.save(updated)
    await this.eventBus.publish(updated.pullDomainEvents())
  }
}

import { EventBus } from '@shared/domain/events'
import { TableRepository } from '../../domain/repositories/table.repository'
import { FindTable } from '../find/find-table'

export class OccupyTable {
  constructor(
    private readonly repository: TableRepository,
    private readonly eventBus: EventBus,
    private readonly findTable: FindTable
  ) {}

  async run(tableId: string, orderId: string): Promise<void> {
    const table = await this.findTable.run(tableId)
    table.ensureIsAvailable()
    table.setCurrentOrder(orderId)
    await this.repository.save(table)
    await this.eventBus.publish(table.pullDomainEvents())
  }
}

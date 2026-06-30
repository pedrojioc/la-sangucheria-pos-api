import { EventBus } from '@shared/domain/events'
import { TableRepository } from '../../domain/repositories/table.repository'
import { FindTable } from '../find/find-table'
import { TableStatus } from '../../domain/table-status'

export class ChangeTableStatus {
  constructor(
    private readonly repository: TableRepository,
    private readonly eventBus: EventBus,
    private readonly findTable: FindTable
  ) {}

  async run(id: string, status: TableStatus): Promise<void> {
    const table = await this.findTable.run(id)
    table.changeStatus(status)
    await this.repository.save(table)
    await this.eventBus.publish(table.pullDomainEvents())
  }
}

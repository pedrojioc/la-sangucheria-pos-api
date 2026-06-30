import { TableRepository } from '../../domain/repositories/table.repository'
import { EventBus } from '@shared/domain/events'
import { FindTable } from '../find/find-table'

export class MoveTable {
  constructor(
    private readonly repository: TableRepository,
    private readonly eventBus: EventBus,
    private readonly findTable: FindTable
  ) {}

  async run(
    id: string,
    positionX: number | null,
    positionY: number | null,
    rotation?: number
  ): Promise<void> {
    const table = await this.findTable.run(id)
    table.move(positionX, positionY, rotation)
    await this.repository.save(table)
    await this.eventBus.publish(table.pullDomainEvents())
  }
}

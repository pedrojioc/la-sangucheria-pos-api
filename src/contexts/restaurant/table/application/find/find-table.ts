import { TableRepository } from '../../domain/repositories/table.repository'
import { TableId } from '../../domain/table-id'
import { TableNotExist } from '../../domain/exceptions/table-not-exist.exception'
import { Table } from '../../domain/table'

export class FindTable {
  constructor(private readonly repository: TableRepository) {}

  async run(id: string): Promise<Table> {
    const table = await this.repository.search(new TableId(id))

    if (!table) {
      throw new TableNotExist(id)
    }

    return table
  }
}

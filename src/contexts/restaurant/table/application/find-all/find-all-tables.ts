import { TableRepository } from '../../domain/repositories/table.repository'
import { Table } from '../../domain/table'

export class FindAllTables {
  constructor(private readonly repository: TableRepository) {}

  async run(): Promise<Table[]> {
    return this.repository.searchAll()
  }
}

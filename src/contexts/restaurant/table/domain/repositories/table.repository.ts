import { Table } from '../table'
import { TableId } from '../table-id'

export abstract class TableRepository {
  abstract save(table: Table): Promise<void>
  abstract search(id: TableId): Promise<Table | null>
  abstract searchByNumber(number: string): Promise<Table | null>
  abstract searchAll(): Promise<Table[]>
}

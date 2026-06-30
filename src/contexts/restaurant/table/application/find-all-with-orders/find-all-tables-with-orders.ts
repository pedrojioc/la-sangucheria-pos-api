import { TableQueryService } from '../services/table-query.service'
import { TableWithOrderResponse } from '../dto/table-with-order.response'

export class FindAllTablesWithOrders {
  constructor(private readonly queryService: TableQueryService) {}

  async run(): Promise<TableWithOrderResponse[]> {
    return this.queryService.searchAllWithOrders()
  }
}

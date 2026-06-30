import { TableWithOrderResponse } from '../dto/table-with-order.response'

export abstract class TableQueryService {
  abstract searchAllWithOrders(): Promise<TableWithOrderResponse[]>
}

import { TableStatus } from '../../domain/table-status'
import { TableShape } from '../../domain/table-shape'
import { Table } from '../../domain/table'

export class TableResponse {
  id: string
  number: string
  capacity: number
  status: TableStatus
  shape: TableShape
  currentOrderId: string | null
  zoneId: string | null
  positionX: number | null
  positionY: number | null
  rotation: number

  static fromAggregate(table: Table): TableResponse {
    const p = table.toPrimitives()
    const response = new TableResponse()
    response.id = p.id
    response.number = p.number
    response.capacity = p.capacity
    response.status = p.status
    response.shape = p.shape
    response.currentOrderId = p.currentOrderId
    response.zoneId = p.zoneId
    response.positionX = p.positionX
    response.positionY = p.positionY
    response.rotation = p.rotation
    return response
  }
}

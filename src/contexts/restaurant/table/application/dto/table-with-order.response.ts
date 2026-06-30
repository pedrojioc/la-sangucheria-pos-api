import { TableStatus } from '../../domain/table-status'
import { TableShape } from '../../domain/table-shape'

export interface CurrentOrderSummary {
  id: string
  orderNumber: string
  status: string
  type: string
  subtotal: number
  total: number
  openedAt: Date
  itemCount: number
}

export class TableWithOrderResponse {
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
  currentOrder: CurrentOrderSummary | null
}

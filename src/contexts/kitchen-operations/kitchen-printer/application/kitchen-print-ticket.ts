import { OrderType } from '@contexts/orders/order/domain/order-type'

export interface KitchenPrintTicket {
  ticketNumber: number
  tableLabel: string
  stationName: string
  printerAddress: string | null
  sentAt: Date
  orderType: OrderType
  isReprint: boolean
  items: Array<{
    productName: string
    quantity: number
    notes: string | null
    modifiers: string[]
  }>
}

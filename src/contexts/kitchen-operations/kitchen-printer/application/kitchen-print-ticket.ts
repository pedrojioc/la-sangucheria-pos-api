import { OrderType } from '@contexts/orders/order/domain/order-type'

export interface KitchenPrintTicket {
  ticketNumber: number
  tableLabel: string
  stationName: string
  connectionType: 'network' | 'usb'
  printerAddress: string | null
  usbIdentifier: string | null
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

import { KitchenOrderType } from '../domain/kitchen-order-type'

export interface KitchenPrintTicket {
  ticketNumber: number
  tableLabel: string
  stationName: string
  connectionType: 'network' | 'usb'
  printerAddress: string | null
  usbIdentifier: string | null
  sentAt: Date
  orderType: KitchenOrderType
  isReprint: boolean
  items: Array<{
    productName: string
    quantity: number
    notes: string | null
    modifiers: string[]
  }>
}

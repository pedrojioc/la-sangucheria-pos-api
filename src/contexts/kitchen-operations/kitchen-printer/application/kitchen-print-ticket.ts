export interface KitchenPrintTicket {
  ticketNumber: number
  tableLabel: string
  stationName: string
  printerAddress: string
  items: Array<{
    productName: string
    quantity: number
    notes: string | null
    modifiers: string[]
  }>
}

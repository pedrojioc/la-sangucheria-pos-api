import { KitchenPrintTicket } from '../kitchen-print-ticket'

export abstract class KitchenPrinterPort {
  abstract print(ticket: KitchenPrintTicket): Promise<void>
}

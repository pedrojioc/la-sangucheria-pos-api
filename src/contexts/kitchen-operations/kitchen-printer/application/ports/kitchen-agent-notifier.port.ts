import { KitchenPrintTicket } from '../kitchen-print-ticket'

export interface NotifyResult {
  delivered: boolean
}

export abstract class KitchenAgentNotifierPort {
  abstract notify(ticket: KitchenPrintTicket, jobId: string): Promise<NotifyResult>
}

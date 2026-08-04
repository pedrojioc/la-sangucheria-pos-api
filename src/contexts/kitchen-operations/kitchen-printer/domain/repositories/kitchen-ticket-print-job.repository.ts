import { KitchenTicketPrintJob } from '../kitchen-ticket-print-job'

export abstract class KitchenTicketPrintJobRepository {
  abstract save(job: KitchenTicketPrintJob): Promise<void>

  abstract search(id: string): Promise<KitchenTicketPrintJob | null>

  // MUST filter status IN ('pending', 'delivered') — NEVER status = 'pending' alone.
  // 'delivered' is still observationally unprinted (reached the agent, print not
  // yet confirmed by print-ack). See design DECISION 3.
  abstract searchUnprinted(): Promise<KitchenTicketPrintJob[]>

  // MUST filter status = 'failed' only. Deliberately SEPARATE from searchUnprinted()
  // so "in flight" and "broken, needs a human" stay distinct signals.
  abstract searchFailed(): Promise<KitchenTicketPrintJob[]>
}

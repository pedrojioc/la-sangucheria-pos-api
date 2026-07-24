import { KitchenTicketPrintJobRepository } from '../../domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJob } from '../../domain/kitchen-ticket-print-job'

export class FindUnprintedPrintJobs {
  constructor(private readonly repository: KitchenTicketPrintJobRepository) {}

  async run(): Promise<KitchenTicketPrintJob[]> {
    return this.repository.searchUnprinted()
  }
}

import { KitchenTicketPrintJobRepository } from '../../domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJobNotFound } from '../../domain/exceptions/kitchen-ticket-print-job-not-found.exception'
import { KitchenTicketPrintJobNotReprintable } from '../../domain/exceptions/kitchen-ticket-print-job-not-reprintable.exception'
import { KitchenAgentNotifierPort } from '../ports/kitchen-agent-notifier.port'
import { KitchenPrintTicket } from '../kitchen-print-ticket'

export class ReprintKitchenTicket {
  constructor(
    private readonly repository: KitchenTicketPrintJobRepository,
    private readonly agentNotifier: KitchenAgentNotifierPort
  ) {}

  async run(jobId: string): Promise<void> {
    const job = await this.repository.search(jobId)

    if (job === null) {
      throw new KitchenTicketPrintJobNotFound(jobId)
    }

    const { status, payload } = job.toPrimitives()

    if (status === 'printed') {
      throw new KitchenTicketPrintJobNotReprintable(jobId)
    }

    const reprintTicket: KitchenPrintTicket = {
      ...payload,
      isReprint: true
    }

    // Reprint follows the same connectionType branching as original dispatch:
    // it always routes through the notifier port because print jobs are only
    // ever created for USB stations (see KitchenPrinterDispatcher).
    const { delivered } = await this.agentNotifier.notify(reprintTicket, job.id)

    if (delivered) {
      job.markDelivered()
      await this.repository.save(job)
    }
    // delivered:false leaves the job in its current (pending/delivered) state —
    // still unprinted, no additional save needed.
  }
}

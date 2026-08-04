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
      // retryFromFailure() no-ops when the job isn't 'failed' (e.g. a normal
      // pending/delivered job) and otherwise atomically clears the failure
      // state — it does NOT replace markDelivered() as a general-purpose
      // transition, so a non-failed job would stay unmoved by this call alone.
      // Since every reachable status here (pending/delivered/failed) must end
      // up 'delivered' on a successful reprint, call both guarded transitions;
      // exactly one of them applies per job.
      job.markDelivered()
      job.retryFromFailure()
      await this.repository.save(job)
    }
    // delivered:false leaves the job in its current (pending/delivered/failed)
    // state — no additional save needed.
  }
}

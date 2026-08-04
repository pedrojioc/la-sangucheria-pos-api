import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'

export class AcknowledgePrintJob {
  constructor(private readonly repository: KitchenTicketPrintJobRepository) {}

  // Ack idempotency: unknown job id is ignored/logged, no-op. markPrinted()
  // itself guards against double-transition on an already-printed job.
  async run(jobId: string): Promise<void> {
    const job = await this.repository.search(jobId)

    if (!job) {
      console.warn('AcknowledgePrintJob: received print-ack for unknown job id', { jobId })
      return
    }

    job.markPrinted()
    await this.repository.save(job)
  }
}

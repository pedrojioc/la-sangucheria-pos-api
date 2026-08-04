import { FailureReason } from '@contexts/kitchen-operations/kitchen-printer/domain/kitchen-ticket-print-job'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'

export class ReportPrintJobFailure {
  constructor(private readonly repository: KitchenTicketPrintJobRepository) {}

  // Nack idempotency: unknown job id is ignored/logged, no-op. markFailed()
  // itself guards against regressing an already-printed job back to failed.
  async run(jobId: string, reason: FailureReason): Promise<void> {
    const job = await this.repository.search(jobId)

    if (!job) {
      console.warn('ReportPrintJobFailure: received print-nack for unknown job id', { jobId })
      return
    }

    job.markFailed(reason)
    await this.repository.save(job)
  }
}

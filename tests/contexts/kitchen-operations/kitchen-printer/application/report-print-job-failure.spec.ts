import { ReportPrintJobFailure } from '@contexts/kitchen-operations/kitchen-printer/application/report-print-job-failure/report-print-job-failure'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJobMother } from '../__mothers__/kitchen-ticket-print-job.mother'

describe('ReportPrintJobFailure', () => {
  let repository: jest.Mocked<KitchenTicketPrintJobRepository>
  let useCase: ReportPrintJobFailure

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchUnprinted: jest.fn(),
      searchFailed: jest.fn()
    }
    useCase = new ReportPrintJobFailure(repository)
  })

  it('marks a pending job as failed with the given reason and saves it', async () => {
    const job = KitchenTicketPrintJobMother.create()
    repository.search.mockResolvedValue(job)

    await useCase.run(job.id, 'out-of-paper')

    const primitives = job.toPrimitives()
    expect(primitives.status).toBe('failed')
    expect(primitives.failureReason).toBe('out-of-paper')
    expect(repository.save).toHaveBeenCalledWith(job)
  })

  it('marks a delivered job as failed with the given reason and saves it', async () => {
    const job = KitchenTicketPrintJobMother.create()
    job.markDelivered()
    repository.search.mockResolvedValue(job)

    await useCase.run(job.id, 'jammed')

    const primitives = job.toPrimitives()
    expect(primitives.status).toBe('failed')
    expect(primitives.failureReason).toBe('jammed')
    expect(repository.save).toHaveBeenCalledWith(job)
  })

  it('is a no-op and does not save when the job id is unknown', async () => {
    repository.search.mockResolvedValue(null)

    await useCase.run('unknown-job-id', 'unknown')

    expect(repository.save).not.toHaveBeenCalled()
  })
})

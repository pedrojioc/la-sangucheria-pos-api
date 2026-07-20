import { AcknowledgePrintJob } from '@contexts/kitchen-operations/kitchen-printer/application/acknowledge/acknowledge-print-job'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJobMother } from '../__mothers__/kitchen-ticket-print-job.mother'

describe('AcknowledgePrintJob', () => {
  let repository: jest.Mocked<KitchenTicketPrintJobRepository>
  let useCase: AcknowledgePrintJob

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchUnprinted: jest.fn()
    }
    useCase = new AcknowledgePrintJob(repository)
  })

  it('marks a pending job as printed and saves it', async () => {
    const job = KitchenTicketPrintJobMother.create()
    repository.search.mockResolvedValue(job)

    await useCase.run(job.id)

    expect(job.toPrimitives().status).toBe('printed')
    expect(repository.save).toHaveBeenCalledWith(job)
  })

  it('marks a delivered job as printed and saves it', async () => {
    const job = KitchenTicketPrintJobMother.create()
    job.markDelivered()
    repository.search.mockResolvedValue(job)

    await useCase.run(job.id)

    expect(job.toPrimitives().status).toBe('printed')
    expect(repository.save).toHaveBeenCalledWith(job)
  })

  it('is a no-op (but still saves) for an already-printed job', async () => {
    const job = KitchenTicketPrintJobMother.create()
    job.markPrinted()
    const firstPrintedAt = job.toPrimitives().printedAt
    repository.search.mockResolvedValue(job)

    await useCase.run(job.id)

    expect(job.toPrimitives().printedAt).toEqual(firstPrintedAt)
  })

  it('is a no-op and does not save when the job id is unknown', async () => {
    repository.search.mockResolvedValue(null)

    await useCase.run('unknown-job-id')

    expect(repository.save).not.toHaveBeenCalled()
  })
})

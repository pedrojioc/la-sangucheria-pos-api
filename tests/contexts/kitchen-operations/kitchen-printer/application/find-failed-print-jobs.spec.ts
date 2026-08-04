import { FindFailedPrintJobs } from '@contexts/kitchen-operations/kitchen-printer/application/find-failed/find-failed-print-jobs'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJobMother } from '../__mothers__/kitchen-ticket-print-job.mother'

describe('FindFailedPrintJobs', () => {
  let useCase: FindFailedPrintJobs
  let repository: jest.Mocked<KitchenTicketPrintJobRepository>

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      search: jest.fn(),
      searchUnprinted: jest.fn(),
      searchFailed: jest.fn()
    }
    useCase = new FindFailedPrintJobs(repository)
  })

  it('delegates to repository.searchFailed and returns its result', async () => {
    const job = KitchenTicketPrintJobMother.create()
    job.markFailed('offline')
    repository.searchFailed.mockResolvedValue([job])

    const result = await useCase.run()

    expect(repository.searchFailed).toHaveBeenCalledTimes(1)
    expect(result).toEqual([job])
  })
})

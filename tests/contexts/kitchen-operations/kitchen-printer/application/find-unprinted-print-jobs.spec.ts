import { FindUnprintedPrintJobs } from '@contexts/kitchen-operations/kitchen-printer/application/find-unprinted/find-unprinted-print-jobs'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJob } from '@contexts/kitchen-operations/kitchen-printer/domain/kitchen-ticket-print-job'
import { KitchenPrintTicket } from '@contexts/kitchen-operations/kitchen-printer/application/kitchen-print-ticket'
import { OrderType } from '@contexts/orders/order/domain/order-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('FindUnprintedPrintJobs', () => {
  let useCase: FindUnprintedPrintJobs
  let repository: jest.Mocked<KitchenTicketPrintJobRepository>

  const buildPayload = (): KitchenPrintTicket => ({
    ticketNumber: 1,
    tableLabel: 'Mesa 1',
    stationName: 'Barra USB',
    printerAddress: null,
    sentAt: new Date(),
    orderType: OrderType.DINE_IN,
    isReprint: false,
    items: []
  })

  beforeEach(() => {
    repository = {
      save: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue(null),
      searchUnprinted: jest.fn().mockResolvedValue([])
    } as jest.Mocked<KitchenTicketPrintJobRepository>

    useCase = new FindUnprintedPrintJobs(repository)
  })

  it('delegates to repository.searchUnprinted and returns its result', async () => {
    const job = KitchenTicketPrintJob.create({
      id: UuidMother.random(),
      ticketNumber: 1,
      stationId: UuidMother.random(),
      stationName: 'Barra USB',
      payload: buildPayload()
    })
    repository.searchUnprinted.mockResolvedValue([job])

    const result = await useCase.run()

    expect(repository.searchUnprinted).toHaveBeenCalledTimes(1)
    expect(result).toEqual([job])
  })
})

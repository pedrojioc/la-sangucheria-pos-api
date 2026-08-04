import { ReprintKitchenTicket } from '@contexts/kitchen-operations/kitchen-printer/application/reprint/reprint-kitchen-ticket'
import { KitchenAgentNotifierPort } from '@contexts/kitchen-operations/kitchen-printer/application/ports/kitchen-agent-notifier.port'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJob } from '@contexts/kitchen-operations/kitchen-printer/domain/kitchen-ticket-print-job'
import { KitchenTicketPrintJobNotFound } from '@contexts/kitchen-operations/kitchen-printer/domain/exceptions/kitchen-ticket-print-job-not-found.exception'
import { KitchenTicketPrintJobNotReprintable } from '@contexts/kitchen-operations/kitchen-printer/domain/exceptions/kitchen-ticket-print-job-not-reprintable.exception'
import { KitchenPrintTicket } from '@contexts/kitchen-operations/kitchen-printer/application/kitchen-print-ticket'
import { OrderType } from '@contexts/orders/order/domain/order-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('ReprintKitchenTicket', () => {
  let useCase: ReprintKitchenTicket
  let repository: jest.Mocked<KitchenTicketPrintJobRepository>
  let agentNotifier: jest.Mocked<KitchenAgentNotifierPort>

  const buildPayload = (): KitchenPrintTicket => ({
    ticketNumber: 42,
    tableLabel: 'Mesa 5',
    stationName: 'Barra USB',
    printerAddress: null,
    sentAt: new Date('2026-07-18T15:30:00Z'),
    orderType: OrderType.DINE_IN,
    isReprint: false,
    items: [{ productName: 'Choripan', quantity: 2, notes: null, modifiers: ['Extra queso'] }]
  })

  beforeEach(() => {
    repository = {
      save: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue(null),
      searchUnprinted: jest.fn().mockResolvedValue([]),
      searchFailed: jest.fn().mockResolvedValue([])
    } as jest.Mocked<KitchenTicketPrintJobRepository>

    agentNotifier = {
      notify: jest.fn().mockResolvedValue({ delivered: false })
    } as jest.Mocked<KitchenAgentNotifierPort>

    useCase = new ReprintKitchenTicket(repository, agentNotifier)
  })

  it('re-dispatches with isReprint true and preserves all other ticket fields', async () => {
    const jobId = UuidMother.random()
    const stationId = UuidMother.random()
    const job = KitchenTicketPrintJob.create({
      id: jobId,
      ticketNumber: 42,
      stationId,
      stationName: 'Barra USB',
      payload: buildPayload()
    })
    repository.search.mockResolvedValue(job)
    agentNotifier.notify.mockResolvedValue({ delivered: true })

    await useCase.run(jobId)

    expect(agentNotifier.notify).toHaveBeenCalledTimes(1)
    const [ticketArg, jobIdArg] = agentNotifier.notify.mock.calls[0]
    expect(ticketArg.isReprint).toBe(true)
    expect(ticketArg.ticketNumber).toBe(42)
    expect(ticketArg.tableLabel).toBe('Mesa 5')
    expect(ticketArg.stationName).toBe('Barra USB')
    expect(ticketArg.items).toEqual(buildPayload().items)
    expect(jobIdArg).toBe(jobId)
  })

  it('transitions the job to delivered when notify resolves delivered:true', async () => {
    const jobId = UuidMother.random()
    const stationId = UuidMother.random()
    const job = KitchenTicketPrintJob.create({
      id: jobId,
      ticketNumber: 42,
      stationId,
      stationName: 'Barra USB',
      payload: buildPayload()
    })
    repository.search.mockResolvedValue(job)
    agentNotifier.notify.mockResolvedValue({ delivered: true })

    await useCase.run(jobId)

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ id: jobId }))
    const savedJob = repository.save.mock.calls[0][0]
    expect(savedJob.toPrimitives().status).toBe('delivered')
  })

  it('rejects reprint of a non-existent job id', async () => {
    const jobId = UuidMother.random()
    repository.search.mockResolvedValue(null)

    await expect(useCase.run(jobId)).rejects.toThrow(KitchenTicketPrintJobNotFound)

    expect(agentNotifier.notify).not.toHaveBeenCalled()
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('rejects reprint of an already-printed job', async () => {
    const jobId = UuidMother.random()
    const stationId = UuidMother.random()
    const job = KitchenTicketPrintJob.create({
      id: jobId,
      ticketNumber: 42,
      stationId,
      stationName: 'Barra USB',
      payload: buildPayload()
    })
    job.markPrinted()
    repository.search.mockResolvedValue(job)

    await expect(useCase.run(jobId)).rejects.toThrow(KitchenTicketPrintJobNotReprintable)

    expect(agentNotifier.notify).not.toHaveBeenCalled()
    expect(repository.save).not.toHaveBeenCalled()
  })

  it('(defect-2 regression) clears failure state and lands the job at delivered when a failed job is reprinted successfully', async () => {
    const jobId = UuidMother.random()
    const stationId = UuidMother.random()
    const job = KitchenTicketPrintJob.create({
      id: jobId,
      ticketNumber: 42,
      stationId,
      stationName: 'Barra USB',
      payload: buildPayload()
    })
    job.markFailed('out-of-paper')
    repository.search.mockResolvedValue(job)
    agentNotifier.notify.mockResolvedValue({ delivered: true })

    await useCase.run(jobId)

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ id: jobId }))
    const savedJob = repository.save.mock.calls[0][0]
    const primitives = savedJob.toPrimitives()
    expect(primitives.status).toBe('delivered')
    expect(primitives.failureReason).toBeNull()
    expect(primitives.failedAt).toBeNull()
  })

  it('leaves a failed job unchanged when the reprint is not delivered', async () => {
    const jobId = UuidMother.random()
    const stationId = UuidMother.random()
    const job = KitchenTicketPrintJob.create({
      id: jobId,
      ticketNumber: 42,
      stationId,
      stationName: 'Barra USB',
      payload: buildPayload()
    })
    job.markFailed('offline')
    repository.search.mockResolvedValue(job)
    agentNotifier.notify.mockResolvedValue({ delivered: false })

    await useCase.run(jobId)

    expect(repository.save).not.toHaveBeenCalled()
    expect(job.toPrimitives().status).toBe('failed')
  })

  it('routes a USB-destined job through notifierPort.notify, same as original dispatch', async () => {
    const jobId = UuidMother.random()
    const stationId = UuidMother.random()
    const job = KitchenTicketPrintJob.create({
      id: jobId,
      ticketNumber: 42,
      stationId,
      stationName: 'Barra USB',
      payload: buildPayload()
    })
    repository.search.mockResolvedValue(job)
    agentNotifier.notify.mockResolvedValue({ delivered: false })

    await useCase.run(jobId)

    expect(agentNotifier.notify).toHaveBeenCalledTimes(1)
  })
})

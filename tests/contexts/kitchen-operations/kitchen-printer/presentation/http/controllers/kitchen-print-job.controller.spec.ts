import { KitchenPrintJobController } from '@contexts/kitchen-operations/kitchen-printer/presentation/http/controllers/kitchen-print-job.controller'
import { FindUnprintedPrintJobs } from '@contexts/kitchen-operations/kitchen-printer/application/find-unprinted/find-unprinted-print-jobs'
import { ReprintKitchenTicket } from '@contexts/kitchen-operations/kitchen-printer/application/reprint/reprint-kitchen-ticket'
import { KitchenTicketPrintJob } from '@contexts/kitchen-operations/kitchen-printer/domain/kitchen-ticket-print-job'
import { KitchenTicketPrintJobNotFound } from '@contexts/kitchen-operations/kitchen-printer/domain/exceptions/kitchen-ticket-print-job-not-found.exception'
import { KitchenPrintTicket } from '@contexts/kitchen-operations/kitchen-printer/application/kitchen-print-ticket'
import { OrderType } from '@contexts/orders/order/domain/order-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('KitchenPrintJobController', () => {
  let controller: KitchenPrintJobController
  let findUnprintedPrintJobs: jest.Mocked<FindUnprintedPrintJobs>
  let reprintKitchenTicket: jest.Mocked<ReprintKitchenTicket>

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
    findUnprintedPrintJobs = {
      run: jest.fn().mockResolvedValue([])
    } as unknown as jest.Mocked<FindUnprintedPrintJobs>

    reprintKitchenTicket = {
      run: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<ReprintKitchenTicket>

    controller = new KitchenPrintJobController(findUnprintedPrintJobs, reprintKitchenTicket)
  })

  describe('GET /kitchen-print-jobs', () => {
    it('returns the list of unprinted jobs', async () => {
      const job = KitchenTicketPrintJob.create({
        id: UuidMother.random(),
        ticketNumber: 1,
        stationId: UuidMother.random(),
        stationName: 'Barra USB',
        payload: buildPayload()
      })
      findUnprintedPrintJobs.run.mockResolvedValue([job])

      const result = await controller.findUnprinted()

      expect(findUnprintedPrintJobs.run).toHaveBeenCalledTimes(1)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(job.id)
      expect(result[0].status).toBe('pending')
    })
  })

  describe('POST /kitchen-print-jobs/:id/reprint', () => {
    it('invokes ReprintKitchenTicket with the given id', async () => {
      const jobId = UuidMother.random()

      await controller.reprint(jobId)

      expect(reprintKitchenTicket.run).toHaveBeenCalledWith(jobId)
    })

    it('propagates a not-found rejection to the caller (handled globally by DomainExceptionFilter)', async () => {
      const jobId = UuidMother.random()
      reprintKitchenTicket.run.mockRejectedValue(new KitchenTicketPrintJobNotFound(jobId))

      await expect(controller.reprint(jobId)).rejects.toThrow(KitchenTicketPrintJobNotFound)
    })
  })
})

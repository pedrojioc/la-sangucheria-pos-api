import { faker } from '@faker-js/faker'
import { KitchenTicketPrintJob } from '@contexts/kitchen-operations/kitchen-printer/domain/kitchen-ticket-print-job'
import { KitchenPrintTicketMother } from './kitchen-print-ticket.mother'

export class KitchenTicketPrintJobMother {
  static create(
    params: Partial<{
      id: string
      ticketNumber: number
      stationId: string
      stationName: string
    }> = {}
  ): KitchenTicketPrintJob {
    return KitchenTicketPrintJob.create({
      id: params.id ?? faker.string.uuid(),
      ticketNumber: params.ticketNumber ?? faker.number.int({ min: 1, max: 999 }),
      stationId: params.stationId ?? faker.string.uuid(),
      stationName: params.stationName ?? 'Parrilla',
      payload: KitchenPrintTicketMother.create()
    })
  }
}

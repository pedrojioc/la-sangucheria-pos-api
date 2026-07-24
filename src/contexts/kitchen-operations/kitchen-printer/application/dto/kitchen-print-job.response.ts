import { KitchenTicketPrintJob } from '../../domain/kitchen-ticket-print-job'

export class KitchenPrintJobResponse {
  readonly id: string
  readonly ticketNumber: number
  readonly stationId: string
  readonly stationName: string
  readonly status: string
  readonly createdAt: Date
  readonly deliveredAt: Date | null
  readonly printedAt: Date | null

  private constructor(
    id: string,
    ticketNumber: number,
    stationId: string,
    stationName: string,
    status: string,
    createdAt: Date,
    deliveredAt: Date | null,
    printedAt: Date | null
  ) {
    this.id = id
    this.ticketNumber = ticketNumber
    this.stationId = stationId
    this.stationName = stationName
    this.status = status
    this.createdAt = createdAt
    this.deliveredAt = deliveredAt
    this.printedAt = printedAt
  }

  static fromAggregate(job: KitchenTicketPrintJob): KitchenPrintJobResponse {
    const p = job.toPrimitives()
    return new KitchenPrintJobResponse(
      p.id,
      p.ticketNumber,
      p.stationId,
      p.stationName,
      p.status,
      p.createdAt,
      p.deliveredAt,
      p.printedAt
    )
  }
}

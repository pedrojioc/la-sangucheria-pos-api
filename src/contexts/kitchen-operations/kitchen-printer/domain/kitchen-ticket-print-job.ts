import { AggregateRoot } from '@shared/domain/aggregate-root'
import { KitchenPrintTicket } from '../application/kitchen-print-ticket'

export type KitchenTicketPrintJobStatus = 'pending' | 'delivered' | 'printed'

export interface KitchenTicketPrintJobPrimitives {
  id: string
  ticketNumber: number
  stationId: string
  stationName: string
  payload: KitchenPrintTicket
  status: KitchenTicketPrintJobStatus
  createdAt: Date
  deliveredAt: Date | null
  printedAt: Date | null
  updatedAt: Date
}

export interface CreateKitchenTicketPrintJobParams {
  id: string
  ticketNumber: number
  stationId: string
  stationName: string
  payload: KitchenPrintTicket
}

export class KitchenTicketPrintJob extends AggregateRoot {
  private constructor(
    public readonly id: string,
    private readonly ticketNumber: number,
    private readonly stationId: string,
    private readonly stationName: string,
    private readonly payload: KitchenPrintTicket,
    private status: KitchenTicketPrintJobStatus,
    private readonly createdAt: Date,
    private deliveredAt: Date | null,
    private printedAt: Date | null,
    private updatedAt: Date
  ) {
    super()
  }

  static create(params: CreateKitchenTicketPrintJobParams): KitchenTicketPrintJob {
    const now = new Date()

    return new KitchenTicketPrintJob(
      params.id,
      params.ticketNumber,
      params.stationId,
      params.stationName,
      params.payload,
      'pending',
      now,
      null,
      null,
      now
    )
  }

  static fromPrimitives(primitives: KitchenTicketPrintJobPrimitives): KitchenTicketPrintJob {
    return new KitchenTicketPrintJob(
      primitives.id,
      primitives.ticketNumber,
      primitives.stationId,
      primitives.stationName,
      primitives.payload,
      primitives.status,
      primitives.createdAt,
      primitives.deliveredAt,
      primitives.printedAt,
      primitives.updatedAt
    )
  }

  // pending -> delivered only. No-op (does not throw, does not mutate state/timestamps)
  // when already delivered or printed.
  markDelivered(): void {
    if (this.status !== 'pending') {
      return
    }

    this.status = 'delivered'
    this.deliveredAt = new Date()
    this.updatedAt = this.deliveredAt
  }

  // pending|delivered -> printed only. No-op when already printed (ack idempotency).
  markPrinted(): void {
    if (this.status === 'printed') {
      return
    }

    this.status = 'printed'
    this.printedAt = new Date()
    this.updatedAt = this.printedAt
  }

  toPrimitives(): KitchenTicketPrintJobPrimitives {
    return {
      id: this.id,
      ticketNumber: this.ticketNumber,
      stationId: this.stationId,
      stationName: this.stationName,
      payload: this.payload,
      status: this.status,
      createdAt: this.createdAt,
      deliveredAt: this.deliveredAt,
      printedAt: this.printedAt,
      updatedAt: this.updatedAt
    }
  }
}

import { AggregateRoot } from '@shared/domain/aggregate-root'
import { KitchenPrintTicket } from '../application/kitchen-print-ticket'

export type KitchenTicketPrintJobStatus = 'pending' | 'delivered' | 'printed' | 'failed'

export type FailureReason = 'out-of-paper' | 'offline' | 'jammed' | 'unknown'

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
  failureReason: FailureReason | null
  failedAt: Date | null
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
    private failureReason: FailureReason | null,
    private failedAt: Date | null,
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
      primitives.failureReason,
      primitives.failedAt,
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

  // pending|delivered|failed -> failed. No-op when already 'printed' (terminal),
  // guard checked BEFORE any field write (non-regression invariant). Re-nack
  // while already 'failed' updates the reason (last-write-wins), harmless/idempotent.
  markFailed(reason: FailureReason): void {
    if (this.status === 'printed') {
      return
    }

    this.status = 'failed'
    this.failureReason = reason
    this.failedAt = new Date()
    this.updatedAt = this.failedAt
  }

  // Single atomic failure-recovery transition. Called by reprint on the SAME
  // job row when the reprint is delivered. Transitions 'failed' -> 'delivered'
  // AND clears failure fields together, so status and reason can never diverge.
  // No-op if the job is not currently 'failed'.
  retryFromFailure(): void {
    if (this.status !== 'failed') {
      return
    }

    this.status = 'delivered'
    this.deliveredAt = new Date()
    this.failureReason = null
    this.failedAt = null
    this.updatedAt = this.deliveredAt
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
      failureReason: this.failureReason,
      failedAt: this.failedAt,
      updatedAt: this.updatedAt
    }
  }
}

import { KitchenTicketPrintJob } from '@contexts/kitchen-operations/kitchen-printer/domain/kitchen-ticket-print-job'
import { KitchenPrintTicketMother } from '@test/contexts/kitchen-operations/kitchen-printer/__mothers__/kitchen-print-ticket.mother'

describe('KitchenTicketPrintJob', () => {
  const buildJob = (): KitchenTicketPrintJob => {
    const ticket = KitchenPrintTicketMother.create()
    return KitchenTicketPrintJob.create({
      id: 'ecf14e2e-2a3a-4d1a-9d0a-4f1d3a2f5b10',
      ticketNumber: ticket.ticketNumber,
      stationId: 'a1c14e2e-2a3a-4d1a-9d0a-4f1d3a2f5b11',
      stationName: ticket.stationName,
      payload: ticket
    })
  }

  it('creates a job in pending status', () => {
    const job = buildJob()
    const primitives = job.toPrimitives()

    expect(primitives.status).toBe('pending')
    expect(primitives.deliveredAt).toBeNull()
    expect(primitives.printedAt).toBeNull()
  })

  it('transitions pending to delivered on markDelivered', () => {
    const job = buildJob()

    job.markDelivered()
    const primitives = job.toPrimitives()

    expect(primitives.status).toBe('delivered')
    expect(primitives.deliveredAt).not.toBeNull()
  })

  it('is a no-op when markDelivered is called on an already delivered job', () => {
    const job = buildJob()
    job.markDelivered()
    const firstDeliveredAt = job.toPrimitives().deliveredAt

    job.markDelivered()
    const primitives = job.toPrimitives()

    expect(primitives.status).toBe('delivered')
    expect(primitives.deliveredAt).toEqual(firstDeliveredAt)
  })

  it('is a no-op when markDelivered is called on an already printed job', () => {
    const job = buildJob()
    job.markPrinted()

    job.markDelivered()
    const primitives = job.toPrimitives()

    expect(primitives.status).toBe('printed')
    expect(primitives.deliveredAt).toBeNull()
  })

  it('transitions pending directly to printed on markPrinted', () => {
    const job = buildJob()

    job.markPrinted()
    const primitives = job.toPrimitives()

    expect(primitives.status).toBe('printed')
    expect(primitives.printedAt).not.toBeNull()
  })

  it('transitions delivered to printed on markPrinted', () => {
    const job = buildJob()
    job.markDelivered()

    job.markPrinted()
    const primitives = job.toPrimitives()

    expect(primitives.status).toBe('printed')
    expect(primitives.printedAt).not.toBeNull()
  })

  it('is a no-op when markPrinted is called on an already printed job (ack idempotency)', () => {
    const job = buildJob()
    job.markPrinted()
    const firstPrintedAt = job.toPrimitives().printedAt

    job.markPrinted()
    const primitives = job.toPrimitives()

    expect(primitives.status).toBe('printed')
    expect(primitives.printedAt).toEqual(firstPrintedAt)
  })

  it('round-trips through toPrimitives/fromPrimitives', () => {
    const job = buildJob()
    job.markDelivered()

    const restored = KitchenTicketPrintJob.fromPrimitives(job.toPrimitives())

    expect(restored.toPrimitives()).toEqual(job.toPrimitives())
  })

  describe('markFailed', () => {
    it('transitions a pending job to failed and records the reason', () => {
      const job = buildJob()

      job.markFailed('out-of-paper')
      const primitives = job.toPrimitives()

      expect(primitives.status).toBe('failed')
      expect(primitives.failureReason).toBe('out-of-paper')
      expect(primitives.failedAt).not.toBeNull()
    })

    it('transitions a delivered job to failed and records the reason', () => {
      const job = buildJob()
      job.markDelivered()

      job.markFailed('jammed')
      const primitives = job.toPrimitives()

      expect(primitives.status).toBe('failed')
      expect(primitives.failureReason).toBe('jammed')
      expect(primitives.failedAt).not.toBeNull()
    })

    it('is a no-op when markFailed is called on an already printed job (non-regression invariant)', () => {
      const job = buildJob()
      job.markPrinted()

      job.markFailed('offline')
      const primitives = job.toPrimitives()

      expect(primitives.status).toBe('printed')
      expect(primitives.failureReason).toBeNull()
      expect(primitives.failedAt).toBeNull()
    })

    it('is idempotent on a re-nack for an already failed job, updating the reason (last-write-wins)', () => {
      const job = buildJob()
      job.markFailed('out-of-paper')

      job.markFailed('unknown')
      const primitives = job.toPrimitives()

      expect(primitives.status).toBe('failed')
      expect(primitives.failureReason).toBe('unknown')
    })
  })

  describe('retryFromFailure', () => {
    it('transitions a failed job to delivered and clears the failure state', () => {
      const job = buildJob()
      job.markFailed('out-of-paper')

      job.retryFromFailure()
      const primitives = job.toPrimitives()

      expect(primitives.status).toBe('delivered')
      expect(primitives.failureReason).toBeNull()
      expect(primitives.failedAt).toBeNull()
      expect(primitives.deliveredAt).not.toBeNull()
    })

    it('is a no-op when the job is not currently failed', () => {
      const job = buildJob()

      job.retryFromFailure()
      const primitives = job.toPrimitives()

      expect(primitives.status).toBe('pending')
      expect(primitives.deliveredAt).toBeNull()
    })
  })
})

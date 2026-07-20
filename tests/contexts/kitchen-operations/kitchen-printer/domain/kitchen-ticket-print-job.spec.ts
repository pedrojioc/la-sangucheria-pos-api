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
})

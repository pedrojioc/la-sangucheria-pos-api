import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { DISCOVERED_DEVICE_STALE_TTL_MS } from '@contexts/kitchen-operations/printer-discovery/application/find-all/find-discovered-devices'
import { Uuid } from '@shared/domain/value-objects/uuid'
import { KitchenPrinterPort } from './ports/kitchen-printer.port'
import {
  PrinterStationResolverPort,
  ResolvedPrinterStation
} from './ports/printer-station-resolver.port'
import { KitchenAgentNotifierPort } from './ports/kitchen-agent-notifier.port'
import { KitchenTicketPrintJobRepository } from '../domain/repositories/kitchen-ticket-print-job.repository'
import { KitchenTicketPrintJob } from '../domain/kitchen-ticket-print-job'
import { KitchenPrintTicket } from './kitchen-print-ticket'

export class KitchenPrinterDispatcher {
  constructor(
    private readonly printerPort: KitchenPrinterPort,
    private readonly stationResolver: PrinterStationResolverPort,
    private readonly agentNotifier: KitchenAgentNotifierPort,
    private readonly printJobRepository: KitchenTicketPrintJobRepository
  ) {}

  async run(event: OrderSentToKitchenEvent): Promise<void> {
    const payload = event.toPrimitives()

    // Collect only non-null stationIds
    const stationIds = payload.items
      .map(item => item.stationId)
      .filter((id): id is string => id !== null)

    if (stationIds.length === 0) return

    const printerStations = await this.stationResolver.resolvePrinterStations(stationIds)

    if (printerStations.length === 0) return

    // Group items by stationId for efficient lookup
    const itemsByStation = new Map<string, typeof payload.items>()
    for (const item of payload.items) {
      if (item.stationId === null) continue
      const existing = itemsByStation.get(item.stationId) ?? []
      existing.push(item)
      itemsByStation.set(item.stationId, existing)
    }

    for (const station of printerStations) {
      const stationItems = itemsByStation.get(station.stationId) ?? []
      if (stationItems.length === 0) continue

      const ticket: KitchenPrintTicket = {
        ticketNumber: payload.ticketNumber,
        // "Para llevar" substitution when tableLabel is null
        tableLabel: payload.tableLabel ?? 'Para llevar',
        stationName: station.stationName,
        connectionType: station.connectionType,
        printerAddress: station.printerAddress,
        usbIdentifier: station.usbIdentifier,
        sentAt: payload.sentAt,
        orderType: payload.orderType,
        // Original dispatch is never a reprint. Manual reprint re-dispatches
        // through ReprintKitchenTicket with isReprint: true instead.
        isReprint: false,
        items: stationItems.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: (item.modifiers ?? []).map(m => m.name)
        }))
      }

      if (this.isStale(station)) {
        await this.failStaleDispatch(ticket, station.stationId, station.stationName)
        continue
      }

      if (station.connectionType === 'usb') {
        await this.dispatchToUsbStation(ticket, station.stationId, station.stationName)
        continue
      }

      try {
        await this.printerPort.print(ticket)
      } catch (err) {
        console.error('KitchenPrinterDispatcher: print failed', {
          stationName: station.stationName,
          printerAddress: station.printerAddress,
          error: err instanceof Error ? err.message : String(err)
        })
        // continue to next station; do not rethrow
      }
    }
  }

  // Staleness reflects "we have not heard from any agent about this device
  // recently" — a pre-flight concern independent of usb/network delivery
  // path. Computed at dispatch time from lastSeenAt, never stored, using the
  // same TTL rule as FindDiscoveredDevices.
  private isStale(station: ResolvedPrinterStation): boolean {
    return Date.now() - station.lastSeenAt.getTime() > DISCOVERED_DEVICE_STALE_TTL_MS
  }

  // A stale device's ticket is never sent to the agent nor printed directly.
  // The job is still created (visible/queryable/reprintable through the same
  // history as any other failure) and immediately marked failed, reusing the
  // existing 'offline' FailureReason — no new reason is introduced.
  private async failStaleDispatch(
    ticket: KitchenPrintTicket,
    stationId: string,
    stationName: string
  ): Promise<void> {
    const job = KitchenTicketPrintJob.create({
      id: Uuid.random().value,
      ticketNumber: ticket.ticketNumber,
      stationId,
      stationName,
      payload: ticket
    })

    job.markFailed('offline')

    await this.printJobRepository.save(job)
  }

  private async dispatchToUsbStation(
    ticket: KitchenPrintTicket,
    stationId: string,
    stationName: string
  ): Promise<void> {
    const job = KitchenTicketPrintJob.create({
      id: Uuid.random().value,
      ticketNumber: ticket.ticketNumber,
      stationId,
      stationName,
      payload: ticket
    })

    await this.printJobRepository.save(job)

    const { delivered } = await this.agentNotifier.notify(ticket, job.id)

    if (delivered) {
      job.markDelivered()
      await this.printJobRepository.save(job)
    }
    // delivered:false (no agent connected) leaves the job pending — this is the
    // expected/normal "unprinted, no agent connected" case, not an error path.
  }
}

import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { KitchenPrinterPort } from './ports/kitchen-printer.port'
import { PrinterStationResolverPort } from './ports/printer-station-resolver.port'
import { KitchenPrintTicket } from './kitchen-print-ticket'

export class KitchenPrinterDispatcher {
  constructor(
    private readonly printerPort: KitchenPrinterPort,
    private readonly stationResolver: PrinterStationResolverPort
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
        printerAddress: station.printerAddress,
        sentAt: payload.sentAt,
        orderType: payload.orderType,
        // isReprint is hardcoded false until reprint trigger ships — see kitchen-ticket-design follow-up
        isReprint: false,
        items: stationItems.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: (item.modifiers ?? []).map(m => m.name)
        }))
      }

      try {
        await this.printerPort.print(ticket)
      } catch (err) {
        console.error('KitchenPrinterDispatcher: print failed', {
          stationName: station.stationName,
          printerAddress: station.printerAddress,
          error: err instanceof Error ? err.message : String(err)
        })
        // Manual reprint flow is out of scope — isReprint is hardcoded false until
        // the reprint trigger ships (see kitchen-ticket-design follow-up).
        // continue to next station; do not rethrow
      }
    }
  }
}

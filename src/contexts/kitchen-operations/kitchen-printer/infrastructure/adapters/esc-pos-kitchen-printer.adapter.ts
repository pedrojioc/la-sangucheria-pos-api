import { Injectable } from '@nestjs/common'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer')
import { KitchenPrinterPort } from '../../application/ports/kitchen-printer.port'
import { KitchenPrintTicket } from '../../application/kitchen-print-ticket'

const TCP_TIMEOUT_MS = 3000
const DEFAULT_PRINTER_TYPE = 'EPSON'

@Injectable()
export class EscPosKitchenPrinterAdapter extends KitchenPrinterPort {
  async print(ticket: KitchenPrintTicket): Promise<void> {
    const printerType = process.env.KITCHEN_PRINTER_TYPE ?? DEFAULT_PRINTER_TYPE
    const printer = new ThermalPrinter({
      type: PrinterTypes[printerType] ?? PrinterTypes[DEFAULT_PRINTER_TYPE],
      interface: `tcp://${ticket.printerAddress}`,
      options: {
        timeout: TCP_TIMEOUT_MS
      }
    })

    try {
      // Header
      printer.bold(true)
      printer.println(`Nº Ticket: ${ticket.ticketNumber}`)
      printer.println(`Mesa: ${ticket.tableLabel}`)
      printer.println(`Estación: ${ticket.stationName}`)
      printer.bold(false)
      printer.drawLine()

      // Items
      for (const item of ticket.items) {
        printer.println(`${item.quantity}x ${item.productName}`)

        if (item.notes) {
          printer.println(`  Nota: ${item.notes}`)
        }

        for (const modifier of item.modifiers) {
          printer.println(`  + ${modifier}`)
        }
      }

      printer.cut()
      await printer.execute()
    } catch (err) {
      console.error('EscPosKitchenPrinterAdapter: TCP print error', {
        stationName: ticket.stationName,
        error: err instanceof Error ? err.message : String(err)
      })
      // Do not rethrow — caller (dispatcher) continues with next station
    }
  }
}

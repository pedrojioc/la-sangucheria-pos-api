import { Injectable } from '@nestjs/common'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer')
import { KitchenPrinterPort } from '../../application/ports/kitchen-printer.port'
import { KitchenPrintTicket } from '../../application/kitchen-print-ticket'
import { OrderType } from '@contexts/orders/order/domain/order-type'

const TCP_TIMEOUT_MS = 3000
const DEFAULT_PRINTER_TYPE = 'EPSON'

const ORDER_TYPE_BADGE_LABEL: Partial<Record<OrderType, string>> = {
  [OrderType.TAKEOUT]: 'PARA LLEVAR',
  [OrderType.DELIVERY]: 'DELIVERY'
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS_REGEX = /[\x00-\x1F\x7F]/g

function sanitizeForPrint(value: string): string {
  return value.replace(CONTROL_CHARACTERS_REGEX, '')
}

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
      printer.println(`Mesa: ${sanitizeForPrint(ticket.tableLabel)}`)
      printer.println(`Estación: ${sanitizeForPrint(ticket.stationName)}`)
      printer.bold(false)

      // Timestamp
      const time = ticket.sentAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      printer.println(`Hora: ${time}`)

      // Order-type badge (only for TAKEOUT/DELIVERY)
      const badgeLabel = ORDER_TYPE_BADGE_LABEL[ticket.orderType]
      if (badgeLabel) {
        printer.alignCenter()
        printer.invert(true)
        printer.println(badgeLabel)
        printer.invert(false)
        printer.alignLeft()
      }

      // Reprint stamp
      if (ticket.isReprint) {
        printer.alignCenter()
        printer.invert(true)
        printer.println('*** REIMPRESIÓN ***')
        printer.invert(false)
        printer.alignLeft()
      }

      printer.drawLine()

      // Items
      ticket.items.forEach((item, index) => {
        printer.setTextDoubleHeight()
        printer.println(`${item.quantity}x ${sanitizeForPrint(item.productName)}`)
        printer.setTextNormal()

        if (item.notes) {
          printer.println(`  Nota: ${sanitizeForPrint(item.notes)}`)
        }

        for (const modifier of item.modifiers) {
          printer.println(`  + ${sanitizeForPrint(modifier)}`)
        }

        if (index < ticket.items.length - 1) {
          printer.drawLine()
        }
      })

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

import { faker } from '@faker-js/faker'
import { KitchenPrintTicket } from '@contexts/kitchen-operations/kitchen-printer/application/kitchen-print-ticket'
import { OrderType } from '@contexts/orders/order/domain/order-type'

export class KitchenPrintTicketMother {
  static create(params: Partial<KitchenPrintTicket> = {}): KitchenPrintTicket {
    return {
      ticketNumber: params.ticketNumber ?? faker.number.int({ min: 1, max: 999 }),
      tableLabel: params.tableLabel ?? 'Mesa 5',
      stationName: params.stationName ?? 'Parrilla',
      connectionType: params.connectionType ?? 'network',
      printerAddress: params.printerAddress ?? '192.168.1.50',
      sentAt: params.sentAt ?? new Date(),
      orderType: params.orderType ?? OrderType.DINE_IN,
      isReprint: params.isReprint ?? false,
      items: params.items ?? [
        {
          productName: 'Choripan',
          quantity: 2,
          notes: null,
          modifiers: []
        }
      ]
    }
  }
}

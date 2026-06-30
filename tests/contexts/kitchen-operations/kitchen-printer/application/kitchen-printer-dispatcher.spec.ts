import { KitchenPrinterDispatcher } from '@contexts/kitchen-operations/kitchen-printer/application/kitchen-printer-dispatcher'
import { KitchenPrinterPort } from '@contexts/kitchen-operations/kitchen-printer/application/ports/kitchen-printer.port'
import { PrinterStationResolverPort } from '@contexts/kitchen-operations/kitchen-printer/application/ports/printer-station-resolver.port'
import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('KitchenPrinterDispatcher', () => {
  let dispatcher: KitchenPrinterDispatcher
  let printerPort: jest.Mocked<KitchenPrinterPort>
  let stationResolver: jest.Mocked<PrinterStationResolverPort>
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    printerPort = {
      print: jest.fn().mockResolvedValue(undefined)
    } as jest.Mocked<KitchenPrinterPort>

    stationResolver = {
      resolvePrinterStations: jest.fn().mockResolvedValue([])
    } as jest.Mocked<PrinterStationResolverPort>

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    dispatcher = new KitchenPrinterDispatcher(printerPort, stationResolver)
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  const buildEvent = (
    overrides: Partial<{
      tableLabel: string | null
      items: Array<{
        itemId: string
        stationId: string | null
        productName: string
        quantity: number
        notes: string | null
        modifiers: Array<{ name: string; price: number }>
      }>
    }> = {}
  ): OrderSentToKitchenEvent => {
    return new OrderSentToKitchenEvent({
      orderId: UuidMother.random(),
      orderNumber: '#001',
      ticketId: UuidMother.random(),
      ticketNumber: 1,
      items: overrides.items ?? [],
      sentBy: 'waiter-1',
      sentAt: new Date(),
      tableId: UuidMother.random(),
      tableLabel: 'tableLabel' in overrides ? (overrides.tableLabel ?? null) : 'Mesa 5'
    })
  }

  it('groups items by PRINTER station and calls print once per station with items', async () => {
    const stationA = UuidMother.random()
    const stationB = UuidMother.random()

    const event = buildEvent({
      items: [
        {
          itemId: UuidMother.random(),
          stationId: stationA,
          productName: 'Choripan',
          quantity: 2,
          notes: null,
          modifiers: []
        },
        {
          itemId: UuidMother.random(),
          stationId: stationB,
          productName: 'Milanesa',
          quantity: 1,
          notes: null,
          modifiers: []
        }
      ]
    })

    stationResolver.resolvePrinterStations.mockResolvedValue([
      { stationId: stationA, stationName: 'Parrilla', printerAddress: '192.168.1.10' },
      { stationId: stationB, stationName: 'Plancha', printerAddress: '192.168.1.11' }
    ])

    await dispatcher.run(event)

    expect(printerPort.print).toHaveBeenCalledTimes(2)
    expect(printerPort.print).toHaveBeenCalledWith(
      expect.objectContaining({
        stationName: 'Parrilla',
        printerAddress: '192.168.1.10',
        items: [expect.objectContaining({ productName: 'Choripan', quantity: 2 })]
      })
    )
    expect(printerPort.print).toHaveBeenCalledWith(
      expect.objectContaining({
        stationName: 'Plancha',
        printerAddress: '192.168.1.11',
        items: [expect.objectContaining({ productName: 'Milanesa', quantity: 1 })]
      })
    )
  })

  it('discards items with stationId null and never calls print for them', async () => {
    const event = buildEvent({
      items: [
        {
          itemId: UuidMother.random(),
          stationId: null,
          productName: 'Bebida',
          quantity: 1,
          notes: null,
          modifiers: []
        }
      ]
    })

    await dispatcher.run(event)

    expect(stationResolver.resolvePrinterStations).not.toHaveBeenCalled()
    expect(printerPort.print).not.toHaveBeenCalled()
  })

  it('does not call print when resolver returns no PRINTER stations (e.g. all KDS)', async () => {
    const stationId = UuidMother.random()

    const event = buildEvent({
      items: [
        {
          itemId: UuidMother.random(),
          stationId,
          productName: 'Choripan',
          quantity: 1,
          notes: null,
          modifiers: []
        }
      ]
    })

    stationResolver.resolvePrinterStations.mockResolvedValue([])

    await dispatcher.run(event)

    expect(stationResolver.resolvePrinterStations).toHaveBeenCalledWith([stationId])
    expect(printerPort.print).not.toHaveBeenCalled()
  })

  it('substitutes "Para llevar" as tableLabel when the event tableLabel is null', async () => {
    const stationId = UuidMother.random()

    const event = buildEvent({
      tableLabel: null,
      items: [
        {
          itemId: UuidMother.random(),
          stationId,
          productName: 'Choripan',
          quantity: 1,
          notes: null,
          modifiers: []
        }
      ]
    })

    stationResolver.resolvePrinterStations.mockResolvedValue([
      { stationId, stationName: 'Parrilla', printerAddress: '192.168.1.10' }
    ])

    await dispatcher.run(event)

    expect(printerPort.print).toHaveBeenCalledWith(
      expect.objectContaining({ tableLabel: 'Para llevar' })
    )
  })

  it('catches a print failure, logs it, and continues with the next station', async () => {
    const stationA = UuidMother.random()
    const stationB = UuidMother.random()

    const event = buildEvent({
      items: [
        {
          itemId: UuidMother.random(),
          stationId: stationA,
          productName: 'Choripan',
          quantity: 1,
          notes: null,
          modifiers: []
        },
        {
          itemId: UuidMother.random(),
          stationId: stationB,
          productName: 'Milanesa',
          quantity: 1,
          notes: null,
          modifiers: []
        }
      ]
    })

    stationResolver.resolvePrinterStations.mockResolvedValue([
      { stationId: stationA, stationName: 'Parrilla', printerAddress: '192.168.1.10' },
      { stationId: stationB, stationName: 'Plancha', printerAddress: '192.168.1.11' }
    ])

    printerPort.print
      .mockRejectedValueOnce(new Error('TCP timeout'))
      .mockResolvedValueOnce(undefined)

    await expect(dispatcher.run(event)).resolves.toBeUndefined()

    expect(printerPort.print).toHaveBeenCalledTimes(2)
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('only includes modifier names (no price) in the printed ticket', async () => {
    const stationId = UuidMother.random()

    const event = buildEvent({
      items: [
        {
          itemId: UuidMother.random(),
          stationId,
          productName: 'Choripan',
          quantity: 1,
          notes: null,
          modifiers: [
            { name: 'Extra queso', price: 1500 },
            { name: 'Sin cebolla', price: 0 }
          ]
        }
      ]
    })

    stationResolver.resolvePrinterStations.mockResolvedValue([
      { stationId, stationName: 'Parrilla', printerAddress: '192.168.1.10' }
    ])

    await dispatcher.run(event)

    const ticket = printerPort.print.mock.calls[0][0]
    expect(ticket.items[0].modifiers).toEqual(['Extra queso', 'Sin cebolla'])
  })
})

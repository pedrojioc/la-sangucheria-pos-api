import { KitchenPrinterDispatcher } from '@contexts/kitchen-operations/kitchen-printer/application/kitchen-printer-dispatcher'
import { KitchenPrinterPort } from '@contexts/kitchen-operations/kitchen-printer/application/ports/kitchen-printer.port'
import { PrinterStationResolverPort } from '@contexts/kitchen-operations/kitchen-printer/application/ports/printer-station-resolver.port'
import { KitchenAgentNotifierPort } from '@contexts/kitchen-operations/kitchen-printer/application/ports/kitchen-agent-notifier.port'
import { KitchenTicketPrintJobRepository } from '@contexts/kitchen-operations/kitchen-printer/domain/repositories/kitchen-ticket-print-job.repository'
import { OrderSentToKitchenEvent } from '@contexts/orders/order/domain/events/order-sent-to-kitchen.event'
import { OrderType } from '@contexts/orders/order/domain/order-type'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('KitchenPrinterDispatcher', () => {
  let dispatcher: KitchenPrinterDispatcher
  let printerPort: jest.Mocked<KitchenPrinterPort>
  let stationResolver: jest.Mocked<PrinterStationResolverPort>
  let agentNotifier: jest.Mocked<KitchenAgentNotifierPort>
  let printJobRepository: jest.Mocked<KitchenTicketPrintJobRepository>
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    printerPort = {
      print: jest.fn().mockResolvedValue(undefined)
    } as jest.Mocked<KitchenPrinterPort>

    stationResolver = {
      resolvePrinterStations: jest.fn().mockResolvedValue([])
    } as jest.Mocked<PrinterStationResolverPort>

    agentNotifier = {
      notify: jest.fn().mockResolvedValue({ delivered: false })
    } as jest.Mocked<KitchenAgentNotifierPort>

    printJobRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      search: jest.fn().mockResolvedValue(null),
      searchUnprinted: jest.fn().mockResolvedValue([]),
      searchFailed: jest.fn().mockResolvedValue([])
    } as jest.Mocked<KitchenTicketPrintJobRepository>

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)

    dispatcher = new KitchenPrinterDispatcher(
      printerPort,
      stationResolver,
      agentNotifier,
      printJobRepository
    )
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  const buildEvent = (
    overrides: Partial<{
      tableLabel: string | null
      sentAt: Date
      orderType: OrderType
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
      sentAt: overrides.sentAt ?? new Date(),
      tableId: UuidMother.random(),
      tableLabel: 'tableLabel' in overrides ? (overrides.tableLabel ?? null) : 'Mesa 5',
      orderType: overrides.orderType ?? OrderType.DINE_IN
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
      {
        stationId: stationA,
        stationName: 'Parrilla',
        connectionType: 'network',
        printerAddress: '192.168.1.10',
        usbIdentifier: null
      },
      {
        stationId: stationB,
        stationName: 'Plancha',
        connectionType: 'network',
        printerAddress: '192.168.1.11',
        usbIdentifier: null
      }
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
      {
        stationId,
        stationName: 'Parrilla',
        connectionType: 'network',
        printerAddress: '192.168.1.10',
        usbIdentifier: null
      }
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
      {
        stationId: stationA,
        stationName: 'Parrilla',
        connectionType: 'network',
        printerAddress: '192.168.1.10',
        usbIdentifier: null
      },
      {
        stationId: stationB,
        stationName: 'Plancha',
        connectionType: 'network',
        printerAddress: '192.168.1.11',
        usbIdentifier: null
      }
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
      {
        stationId,
        stationName: 'Parrilla',
        connectionType: 'network',
        printerAddress: '192.168.1.10',
        usbIdentifier: null
      }
    ])

    await dispatcher.run(event)

    const ticket = printerPort.print.mock.calls[0][0]
    expect(ticket.items[0].modifiers).toEqual(['Extra queso', 'Sin cebolla'])
  })

  it('threads sentAt and orderType from the event payload onto the ticket', async () => {
    const stationId = UuidMother.random()
    const sentAt = new Date('2026-07-18T15:30:00Z')

    const event = buildEvent({
      sentAt,
      orderType: OrderType.TAKEOUT,
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
      {
        stationId,
        stationName: 'Parrilla',
        connectionType: 'network',
        printerAddress: '192.168.1.10',
        usbIdentifier: null
      }
    ])

    await dispatcher.run(event)

    const ticket = printerPort.print.mock.calls[0][0]
    expect(ticket.sentAt).toBe(sentAt)
    expect(ticket.orderType).toBe(OrderType.TAKEOUT)
  })

  it('always sets isReprint to false on the ticket', async () => {
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

    stationResolver.resolvePrinterStations.mockResolvedValue([
      {
        stationId,
        stationName: 'Parrilla',
        connectionType: 'network',
        printerAddress: '192.168.1.10',
        usbIdentifier: null
      }
    ])

    await dispatcher.run(event)

    const ticket = printerPort.print.mock.calls[0][0]
    expect(ticket.isReprint).toBe(false)
  })

  it('routes a USB station to the agent notifier instead of printerPort.print', async () => {
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

    stationResolver.resolvePrinterStations.mockResolvedValue([
      {
        stationId,
        stationName: 'Barra USB',
        connectionType: 'usb',
        printerAddress: null,
        usbIdentifier: 'usb-device-1'
      }
    ])

    agentNotifier.notify.mockResolvedValue({ delivered: true })

    await dispatcher.run(event)

    expect(printerPort.print).not.toHaveBeenCalled()
    expect(agentNotifier.notify).toHaveBeenCalledTimes(1)
    expect(agentNotifier.notify).toHaveBeenCalledWith(
      expect.objectContaining({ stationName: 'Barra USB' }),
      expect.any(String)
    )
  })

  it('creates a pending KitchenTicketPrintJob before notifying the USB station', async () => {
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

    stationResolver.resolvePrinterStations.mockResolvedValue([
      {
        stationId,
        stationName: 'Barra USB',
        connectionType: 'usb',
        printerAddress: null,
        usbIdentifier: 'usb-device-1'
      }
    ])

    agentNotifier.notify.mockResolvedValue({ delivered: false })

    await dispatcher.run(event)

    expect(printJobRepository.save).toHaveBeenCalledTimes(1)
    const savedJob = printJobRepository.save.mock.calls[0][0]
    expect(savedJob.toPrimitives().status).toBe('pending')
    expect(savedJob.toPrimitives().stationName).toBe('Barra USB')
  })

  it('transitions the job to delivered when notify resolves delivered:true', async () => {
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

    stationResolver.resolvePrinterStations.mockResolvedValue([
      {
        stationId,
        stationName: 'Barra USB',
        connectionType: 'usb',
        printerAddress: null,
        usbIdentifier: 'usb-device-1'
      }
    ])

    agentNotifier.notify.mockResolvedValue({ delivered: true })

    await dispatcher.run(event)

    expect(printJobRepository.save).toHaveBeenCalledTimes(2)
    const finalSavedJob = printJobRepository.save.mock.calls[1][0]
    expect(finalSavedJob.toPrimitives().status).toBe('delivered')
  })

  it('leaves the job pending when notify resolves delivered:false (no agent connected)', async () => {
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

    stationResolver.resolvePrinterStations.mockResolvedValue([
      {
        stationId,
        stationName: 'Barra USB',
        connectionType: 'usb',
        printerAddress: null,
        usbIdentifier: 'usb-device-1'
      }
    ])

    agentNotifier.notify.mockResolvedValue({ delivered: false })

    await dispatcher.run(event)

    expect(printJobRepository.save).toHaveBeenCalledTimes(1)
    const savedJob = printJobRepository.save.mock.calls[0][0]
    expect(savedJob.toPrimitives().status).toBe('pending')
  })

  it('runs mixed NETWORK and USB stations independently in the same dispatch', async () => {
    const networkStationId = UuidMother.random()
    const usbStationId = UuidMother.random()

    const event = buildEvent({
      items: [
        {
          itemId: UuidMother.random(),
          stationId: networkStationId,
          productName: 'Choripan',
          quantity: 1,
          notes: null,
          modifiers: []
        },
        {
          itemId: UuidMother.random(),
          stationId: usbStationId,
          productName: 'Milanesa',
          quantity: 1,
          notes: null,
          modifiers: []
        }
      ]
    })

    stationResolver.resolvePrinterStations.mockResolvedValue([
      {
        stationId: networkStationId,
        stationName: 'Parrilla',
        connectionType: 'network',
        printerAddress: '192.168.1.10',
        usbIdentifier: null
      },
      {
        stationId: usbStationId,
        stationName: 'Barra USB',
        connectionType: 'usb',
        printerAddress: null,
        usbIdentifier: 'usb-device-1'
      }
    ])

    agentNotifier.notify.mockResolvedValue({ delivered: true })

    await dispatcher.run(event)

    expect(printerPort.print).toHaveBeenCalledTimes(1)
    expect(printerPort.print).toHaveBeenCalledWith(
      expect.objectContaining({ stationName: 'Parrilla' })
    )
    expect(agentNotifier.notify).toHaveBeenCalledTimes(1)
    expect(agentNotifier.notify).toHaveBeenCalledWith(
      expect.objectContaining({ stationName: 'Barra USB' }),
      expect.any(String)
    )
  })

  it('a NETWORK print failure does not prevent USB delivery to another station', async () => {
    const networkStationId = UuidMother.random()
    const usbStationId = UuidMother.random()

    const event = buildEvent({
      items: [
        {
          itemId: UuidMother.random(),
          stationId: networkStationId,
          productName: 'Choripan',
          quantity: 1,
          notes: null,
          modifiers: []
        },
        {
          itemId: UuidMother.random(),
          stationId: usbStationId,
          productName: 'Milanesa',
          quantity: 1,
          notes: null,
          modifiers: []
        }
      ]
    })

    stationResolver.resolvePrinterStations.mockResolvedValue([
      {
        stationId: networkStationId,
        stationName: 'Parrilla',
        connectionType: 'network',
        printerAddress: '192.168.1.10',
        usbIdentifier: null
      },
      {
        stationId: usbStationId,
        stationName: 'Barra USB',
        connectionType: 'usb',
        printerAddress: null,
        usbIdentifier: 'usb-device-1'
      }
    ])

    printerPort.print.mockRejectedValueOnce(new Error('TCP timeout'))
    agentNotifier.notify.mockResolvedValue({ delivered: true })

    await expect(dispatcher.run(event)).resolves.toBeUndefined()

    expect(consoleErrorSpy).toHaveBeenCalled()
    expect(agentNotifier.notify).toHaveBeenCalledTimes(1)
  })
})

import { KitchenPrintTicketMother } from '../../__mothers__/kitchen-print-ticket.mother'

const mockPrinterInstance = {
  bold: jest.fn(),
  println: jest.fn(),
  drawLine: jest.fn(),
  cut: jest.fn(),
  execute: jest.fn(),
  setTextDoubleHeight: jest.fn(),
  setTextNormal: jest.fn(),
  alignCenter: jest.fn(),
  alignLeft: jest.fn(),
  invert: jest.fn()
}

const mockThermalPrinterCtor = jest.fn().mockImplementation(() => mockPrinterInstance)

jest.mock('node-thermal-printer', () => ({
  ThermalPrinter: mockThermalPrinterCtor,
  PrinterTypes: { EPSON: 'epson' }
}))

import { EscPosKitchenPrinterAdapter } from '@contexts/kitchen-operations/kitchen-printer/infrastructure/adapters/esc-pos-kitchen-printer.adapter'
import { OrderType } from '@contexts/orders/order/domain/order-type'

describe('EscPosKitchenPrinterAdapter', () => {
  let adapter: EscPosKitchenPrinterAdapter
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrinterInstance.execute.mockResolvedValue(undefined)
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
    adapter = new EscPosKitchenPrinterAdapter()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  it('connects to the printer over TCP using the ticket printerAddress', async () => {
    const ticket = KitchenPrintTicketMother.create({ printerAddress: '192.168.1.99' })

    await adapter.print(ticket)

    expect(mockThermalPrinterCtor).toHaveBeenCalledWith(
      expect.objectContaining({
        interface: 'tcp://192.168.1.99',
        options: expect.objectContaining({ timeout: expect.any(Number) })
      })
    )
  })

  it('builds the ticket layout with header, items, notes and modifiers, then cuts', async () => {
    const ticket = KitchenPrintTicketMother.create({
      ticketNumber: 42,
      tableLabel: 'Mesa 3',
      stationName: 'Parrilla',
      items: [
        {
          productName: 'Choripan',
          quantity: 2,
          notes: 'Sin picante',
          modifiers: ['Extra queso', 'Sin cebolla']
        }
      ]
    })

    await adapter.print(ticket)

    const printedLines = mockPrinterInstance.println.mock.calls.map(call => call[0])

    expect(printedLines).toEqual(
      expect.arrayContaining([
        expect.stringContaining('42'),
        expect.stringContaining('Mesa 3'),
        expect.stringContaining('Parrilla'),
        expect.stringContaining('Choripan'),
        expect.stringContaining('Sin picante'),
        expect.stringContaining('Extra queso'),
        expect.stringContaining('Sin cebolla')
      ])
    )
    expect(mockPrinterInstance.cut).toHaveBeenCalledTimes(1)
    expect(mockPrinterInstance.execute).toHaveBeenCalledTimes(1)
  })

  it('substitutes "Para llevar" when tableLabel reflects a takeaway order', async () => {
    const ticket = KitchenPrintTicketMother.create({ tableLabel: 'Para llevar' })

    await adapter.print(ticket)

    const printedLines = mockPrinterInstance.println.mock.calls.map(call => call[0])
    expect(printedLines).toEqual(expect.arrayContaining([expect.stringContaining('Para llevar')]))
  })

  it('prints modifier names only, without price information', async () => {
    const ticket = KitchenPrintTicketMother.create({
      items: [
        {
          productName: 'Hamburguesa',
          quantity: 1,
          notes: null,
          modifiers: ['Extra tocino']
        }
      ]
    })

    await adapter.print(ticket)

    const printedLines = mockPrinterInstance.println.mock.calls.map(call => call[0])
    const modifierLine = printedLines.find((line: string) => line.includes('Extra tocino'))

    expect(modifierLine).toBeDefined()
    expect(modifierLine).not.toMatch(/\d/)
  })

  it('strips ASCII control characters from free-text fields before printing', async () => {
    const ticket = KitchenPrintTicketMother.create({
      tableLabel: 'Mesa\x1b[31m 3',
      stationName: 'Parrilla\x00',
      items: [
        {
          productName: '\x1b[31mHACK Choripan',
          quantity: 1,
          notes: 'Sin picante\x00 por favor',
          modifiers: ['Extra\x07 queso']
        }
      ]
    })

    await adapter.print(ticket)

    const printedLines = mockPrinterInstance.println.mock.calls.map(call => String(call[0]))

    // eslint-disable-next-line no-control-regex
    expect(printedLines.some(line => /[\x00-\x1F\x7F]/.test(line))).toBe(false)
    expect(printedLines).toEqual(
      expect.arrayContaining([
        'Mesa: Mesa[31m 3',
        'Estación: Parrilla',
        '1x [31mHACK Choripan',
        '  Nota: Sin picante por favor',
        '  + Extra queso'
      ])
    )
  })

  it('catches a print/TCP error, logs it, and does not throw', async () => {
    mockPrinterInstance.execute.mockRejectedValue(new Error('ECONNREFUSED'))

    const ticket = KitchenPrintTicketMother.create()

    await expect(adapter.print(ticket)).resolves.toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  describe('comanda format upgrade', () => {
    it('wraps the quantity/productName line in double-height text', async () => {
      const ticket = KitchenPrintTicketMother.create({
        items: [{ productName: 'Choripan', quantity: 2, notes: null, modifiers: [] }]
      })

      await adapter.print(ticket)

      const qtyLineIndex = mockPrinterInstance.println.mock.calls.findIndex(call =>
        String(call[0]).includes('2x Choripan')
      )
      expect(qtyLineIndex).toBeGreaterThanOrEqual(0)
      expect(mockPrinterInstance.setTextDoubleHeight).toHaveBeenCalled()
      expect(mockPrinterInstance.setTextNormal).toHaveBeenCalled()
    })

    it('renders a timestamp line derived from sentAt', async () => {
      const sentAt = new Date('2026-07-18T15:30:00Z')
      const ticket = KitchenPrintTicketMother.create({ sentAt })

      await adapter.print(ticket)

      const printedLines = mockPrinterInstance.println.mock.calls.map(call => String(call[0]))
      const expectedTime = sentAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      expect(printedLines).toEqual(expect.arrayContaining([expect.stringContaining(expectedTime)]))
    })

    it('draws a separator between multiple items', async () => {
      const ticket = KitchenPrintTicketMother.create({
        items: [
          { productName: 'Choripan', quantity: 1, notes: null, modifiers: [] },
          { productName: 'Milanesa', quantity: 1, notes: null, modifiers: [] }
        ]
      })

      await adapter.print(ticket)

      expect(mockPrinterInstance.drawLine.mock.calls.length).toBeGreaterThanOrEqual(2)
    })

    it('prints cleanly for an item with no notes and no modifiers', async () => {
      const ticket = KitchenPrintTicketMother.create({
        items: [{ productName: 'Empanada', quantity: 1, notes: null, modifiers: [] }]
      })

      await adapter.print(ticket)

      const printedLines = mockPrinterInstance.println.mock.calls.map(call => String(call[0]))
      expect(printedLines.some(line => line.includes('Nota:'))).toBe(false)
      expect(printedLines.some(line => line.includes('+ '))).toBe(false)
      expect(printedLines.some(line => line.includes('1x Empanada'))).toBe(true)
    })

    it('renders a centered/inverted PARA LLEVAR badge for TAKEOUT orders', async () => {
      const ticket = KitchenPrintTicketMother.create({ orderType: OrderType.TAKEOUT })

      await adapter.print(ticket)

      const printedLines = mockPrinterInstance.println.mock.calls.map(call => String(call[0]))
      expect(printedLines).toEqual(expect.arrayContaining([expect.stringContaining('PARA LLEVAR')]))
      expect(mockPrinterInstance.alignCenter).toHaveBeenCalled()
      expect(mockPrinterInstance.invert).toHaveBeenCalledWith(true)
      expect(mockPrinterInstance.invert).toHaveBeenCalledWith(false)
      expect(mockPrinterInstance.alignLeft).toHaveBeenCalled()
    })

    it('renders a centered/inverted DELIVERY badge for DELIVERY orders', async () => {
      const ticket = KitchenPrintTicketMother.create({ orderType: OrderType.DELIVERY })

      await adapter.print(ticket)

      const printedLines = mockPrinterInstance.println.mock.calls.map(call => String(call[0]))
      expect(printedLines).toEqual(expect.arrayContaining([expect.stringContaining('DELIVERY')]))
    })

    it('renders no order-type badge for DINE_IN orders', async () => {
      const ticket = KitchenPrintTicketMother.create({
        orderType: OrderType.DINE_IN,
        tableLabel: 'Mesa 3'
      })

      await adapter.print(ticket)

      const printedLines = mockPrinterInstance.println.mock.calls.map(call => String(call[0]))
      expect(printedLines.some(line => line.includes('PARA LLEVAR'))).toBe(false)
      expect(printedLines.some(line => line.includes('DELIVERY'))).toBe(false)
      expect(printedLines).toEqual(expect.arrayContaining([expect.stringContaining('Mesa 3')]))
    })

    it('renders a REIMPRESIÓN stamp when isReprint is true', async () => {
      const ticket = KitchenPrintTicketMother.create({ isReprint: true })

      await adapter.print(ticket)

      const printedLines = mockPrinterInstance.println.mock.calls.map(call => String(call[0]))
      expect(printedLines).toEqual(expect.arrayContaining([expect.stringContaining('REIMPRESIÓN')]))
    })

    it('renders no REIMPRESIÓN stamp when isReprint is false', async () => {
      const ticket = KitchenPrintTicketMother.create({ isReprint: false })

      await adapter.print(ticket)

      const printedLines = mockPrinterInstance.println.mock.calls.map(call => String(call[0]))
      expect(printedLines.some(line => line.includes('REIMPRESIÓN'))).toBe(false)
    })
  })
})

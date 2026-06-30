import { KitchenPrintTicketMother } from '../../__mothers__/kitchen-print-ticket.mother'

const mockPrinterInstance = {
  bold: jest.fn(),
  println: jest.fn(),
  drawLine: jest.fn(),
  cut: jest.fn(),
  execute: jest.fn()
}

const mockThermalPrinterCtor = jest.fn().mockImplementation(() => mockPrinterInstance)

jest.mock('node-thermal-printer', () => ({
  ThermalPrinter: mockThermalPrinterCtor,
  PrinterTypes: { EPSON: 'epson' }
}))

import { EscPosKitchenPrinterAdapter } from '@contexts/kitchen-operations/kitchen-printer/infrastructure/adapters/esc-pos-kitchen-printer.adapter'

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

  it('catches a print/TCP error, logs it, and does not throw', async () => {
    mockPrinterInstance.execute.mockRejectedValue(new Error('ECONNREFUSED'))

    const ticket = KitchenPrintTicketMother.create()

    await expect(adapter.print(ticket)).resolves.toBeUndefined()
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})

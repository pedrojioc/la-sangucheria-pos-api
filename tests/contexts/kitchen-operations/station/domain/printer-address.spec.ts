import { PrinterAddress } from '@contexts/kitchen-operations/station/domain/printer-address'
import { InvalidPrinterAddress } from '@contexts/kitchen-operations/station/domain/exceptions/invalid-printer-address.exception'

describe('PrinterAddress (VO)', () => {
  it('should normalize bare IPv4 host to host:9100', () => {
    const address = new PrinterAddress('192.168.1.50')
    expect(address.value).toBe('192.168.1.50:9100')
  })

  it('should preserve explicit host:port', () => {
    const address = new PrinterAddress('192.168.1.50:9100')
    expect(address.value).toBe('192.168.1.50:9100')
  })

  it('should accept hostname with explicit port', () => {
    const address = new PrinterAddress('kitchen-printer.local:9100')
    expect(address.value).toBe('kitchen-printer.local:9100')
  })

  it('should normalize bare hostname to hostname:9100', () => {
    const address = new PrinterAddress('kitchen-printer.local')
    expect(address.value).toBe('kitchen-printer.local:9100')
  })

  it('should accept custom port within range', () => {
    const address = new PrinterAddress('10.0.0.1:515')
    expect(address.value).toBe('10.0.0.1:515')
  })

  it('should throw for port out of range (70000)', () => {
    expect(() => new PrinterAddress('192.168.1.50:70000')).toThrow(InvalidPrinterAddress)
  })

  it('should throw for port zero', () => {
    expect(() => new PrinterAddress('192.168.1.50:0')).toThrow(InvalidPrinterAddress)
  })

  it('should throw for negative port', () => {
    expect(() => new PrinterAddress('192.168.1.50:-1')).toThrow(InvalidPrinterAddress)
  })

  it('should throw for empty string', () => {
    expect(() => new PrinterAddress('')).toThrow(InvalidPrinterAddress)
  })

  it('should throw for host with invalid characters', () => {
    expect(() => new PrinterAddress('host with spaces')).toThrow(InvalidPrinterAddress)
  })

  it('should throw for host starting with hyphen', () => {
    expect(() => new PrinterAddress('-invalid.local')).toThrow(InvalidPrinterAddress)
  })
})

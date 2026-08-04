import { UsbPrinterIdentifier } from '@contexts/kitchen-operations/station/domain/usb-printer-identifier'
import { InvalidUsbPrinterIdentifier } from '@contexts/kitchen-operations/station/domain/exceptions/invalid-usb-printer-identifier.exception'

describe('UsbPrinterIdentifier (VO)', () => {
  it('should accept a valid device identifier', () => {
    const identifier = new UsbPrinterIdentifier('USB001')
    expect(identifier.value).toBe('USB001')
  })

  it('should accept a vendor:product style identifier', () => {
    const identifier = new UsbPrinterIdentifier('04b8:0202')
    expect(identifier.value).toBe('04b8:0202')
  })

  it('should trim surrounding whitespace', () => {
    const identifier = new UsbPrinterIdentifier('  USB001  ')
    expect(identifier.value).toBe('USB001')
  })

  it('should throw InvalidUsbPrinterIdentifier for empty string', () => {
    expect(() => new UsbPrinterIdentifier('')).toThrow(InvalidUsbPrinterIdentifier)
  })

  it('should throw InvalidUsbPrinterIdentifier for whitespace-only string', () => {
    expect(() => new UsbPrinterIdentifier('   ')).toThrow(InvalidUsbPrinterIdentifier)
  })

  it('should throw InvalidUsbPrinterIdentifier when identifier exceeds 255 chars', () => {
    expect(() => new UsbPrinterIdentifier('A'.repeat(256))).toThrow(InvalidUsbPrinterIdentifier)
  })

  it('should not be structurally compatible with PrinterAddress host:port normalization', () => {
    // A USB identifier like "COM3" must NOT be silently reshaped into a host:port form.
    const identifier = new UsbPrinterIdentifier('COM3')
    expect(identifier.value).toBe('COM3')
  })
})

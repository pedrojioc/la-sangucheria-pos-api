import { InvalidUsbPrinterIdentifier } from './exceptions/invalid-usb-printer-identifier.exception'

/**
 * Opaque USB device identifier, sibling to PrinterAddress.
 * Structurally independent of PrinterAddress: no host:port parsing/normalization,
 * so a NETWORK address can never satisfy a USB requirement or vice versa.
 */
export class UsbPrinterIdentifier {
  private static readonly MAX_LENGTH = 255

  readonly value: string

  constructor(value: string) {
    const trimmed = (value ?? '').trim()
    this.ensureValid(trimmed, value)
    this.value = trimmed
  }

  private ensureValid(trimmed: string, original: string): void {
    if (!trimmed || trimmed.length > UsbPrinterIdentifier.MAX_LENGTH) {
      throw new InvalidUsbPrinterIdentifier(original)
    }
  }
}

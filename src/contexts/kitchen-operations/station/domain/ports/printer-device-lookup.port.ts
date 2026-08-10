export interface PrinterDeviceLookupResult {
  connectionType: 'network' | 'usb'
  address: string | null
  usbIdentifier: string | null
  model: string | null
  lastSeenAt: Date
}

export abstract class PrinterDeviceLookupPort {
  abstract findById(id: string): Promise<PrinterDeviceLookupResult | null>
}

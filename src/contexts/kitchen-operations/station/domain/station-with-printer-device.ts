import { Station } from './station'

export interface PrinterDeviceSummary {
  model: string | null
  status: string
  address: string | null
}

export class StationWithPrinterDevice {
  constructor(
    public readonly station: Station,
    public readonly printer: PrinterDeviceSummary | null
  ) {}
}

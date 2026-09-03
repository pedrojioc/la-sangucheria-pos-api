import { InvalidValueObjectException } from '@shared/domain/exceptions/domain.exception'

export class PrinterStationRequiresDevice extends InvalidValueObjectException {
  constructor() {
    super('A discoveredPrinterDeviceId is required when the output device is PRINTER')
  }
}

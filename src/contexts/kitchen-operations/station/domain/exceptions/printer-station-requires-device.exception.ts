import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class PrinterStationRequiresDevice extends DomainException {
  constructor() {
    super('A discoveredPrinterDeviceId is required when the output device is PRINTER')
  }
}

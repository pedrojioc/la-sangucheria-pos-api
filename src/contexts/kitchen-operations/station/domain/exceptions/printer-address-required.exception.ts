import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class PrinterAddressRequired extends DomainException {
  constructor() {
    super('A printer address is required when the output device is PRINTER')
  }
}

import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class UsbIdentifierRequired extends DomainException {
  constructor() {
    super(
      'A USB device identifier is required when the output device is PRINTER and connection type is USB'
    )
  }
}

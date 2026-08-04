import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class InvalidUsbPrinterIdentifier extends DomainException {
  constructor(identifier: string) {
    super(
      `Invalid USB printer identifier "${identifier}". Must be a non-empty string up to 255 characters`
    )
  }
}

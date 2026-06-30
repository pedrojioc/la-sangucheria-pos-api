import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class InvalidPrinterAddress extends DomainException {
  constructor(address: string) {
    super(`Invalid printer address "${address}". Must be a valid host or host:port (port 1-65535)`)
  }
}

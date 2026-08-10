import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class DiscoveredPrinterDeviceNotExist extends DomainException {
  constructor(id: string) {
    super(`Discovered printer device with id ${id} does not exist`)
  }
}

import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class DiscoveredPrinterDeviceNotExist extends NotFoundException {
  constructor(id: string) {
    super(`Discovered printer device with id ${id} does not exist`)
  }
}

import { Injectable } from '@nestjs/common'

import {
  PrinterDeviceLookupPort,
  PrinterDeviceLookupResult
} from '@contexts/kitchen-operations/station/domain/ports/printer-device-lookup.port'
import { DiscoveredPrinterDeviceRepository } from '@contexts/kitchen-operations/printer-discovery/domain/repositories/discovered-printer-device.repository'

@Injectable()
export class PrinterDeviceLookupAdapter extends PrinterDeviceLookupPort {
  constructor(private readonly repository: DiscoveredPrinterDeviceRepository) {
    super()
  }

  async findById(id: string): Promise<PrinterDeviceLookupResult | null> {
    const device = await this.repository.findById(id)
    if (!device) return null

    return {
      connectionType: device.getConnectionType(),
      address: device.getAddress(),
      usbIdentifier: device.getUsbIdentifier(),
      model: device.getModel(),
      lastSeenAt: device.toPrimitives().lastSeenAt
    }
  }
}

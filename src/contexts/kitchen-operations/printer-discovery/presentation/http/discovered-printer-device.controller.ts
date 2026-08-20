import { Controller, Get } from '@nestjs/common'

import {
  FindDiscoveredDevices,
  DiscoveredDeviceView
} from '../../application/find-all/find-discovered-devices'
import { EstablishmentRepository } from '@contexts/establishment/establishment/domain/repositories/establishment.repository'

// Same posture as station.controller.ts — under the existing global JWT
// guard, no new guard. Read-only surface for Station configuration.
@Controller('discovered-printer-devices')
export class DiscoveredPrinterDeviceController {
  constructor(
    private readonly findDiscoveredDevices: FindDiscoveredDevices,
    private readonly establishmentRepository: EstablishmentRepository
  ) {}

  @Get()
  async findAll(): Promise<DiscoveredDeviceView[]> {
    const establishment = await this.establishmentRepository.findSingleton()
    return this.findDiscoveredDevices.run(establishment.id.value)
  }
}

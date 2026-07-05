import { EstablishmentRepository } from '../../domain/repositories/establishment.repository'
import { EstablishmentSettingsResponse } from '../dto/establishment-settings.response'
import { StationOutputDevicesPort } from '../ports/station-output-devices.port'
import { deriveKitchenMode } from '../../domain/kitchen-mode'

export class GetEstablishmentSettings {
  constructor(
    private readonly repository: EstablishmentRepository,
    private readonly stationOutputDevicesPort: StationOutputDevicesPort
  ) {}

  async run(): Promise<EstablishmentSettingsResponse> {
    const establishment = await this.repository.findSingleton()
    const devices = await this.stationOutputDevicesPort.list()
    const kitchenMode = deriveKitchenMode(devices)
    return EstablishmentSettingsResponse.fromDomain(establishment, kitchenMode)
  }
}

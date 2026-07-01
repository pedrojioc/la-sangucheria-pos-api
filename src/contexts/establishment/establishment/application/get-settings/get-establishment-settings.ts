import { EstablishmentRepository } from '../../domain/repositories/establishment.repository'
import { EstablishmentSettingsResponse } from '../dto/establishment-settings.response'

export class GetEstablishmentSettings {
  constructor(private readonly repository: EstablishmentRepository) {}

  async run(): Promise<EstablishmentSettingsResponse> {
    const establishment = await this.repository.findSingleton()
    return EstablishmentSettingsResponse.fromDomain(establishment)
  }
}

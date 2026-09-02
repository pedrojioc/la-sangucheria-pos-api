import { EstablishmentSettingsResponse } from './establishment-settings.response'

export class EstablishmentSettingsStatusResponse {
  private constructor(
    public readonly configured: boolean,
    public readonly settings: EstablishmentSettingsResponse | null
  ) {}

  static configured(settings: EstablishmentSettingsResponse): EstablishmentSettingsStatusResponse {
    return new EstablishmentSettingsStatusResponse(true, settings)
  }

  static notConfigured(): EstablishmentSettingsStatusResponse {
    return new EstablishmentSettingsStatusResponse(false, null)
  }
}

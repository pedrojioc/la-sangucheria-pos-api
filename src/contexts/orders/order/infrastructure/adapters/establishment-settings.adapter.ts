import { Injectable } from '@nestjs/common'
import { GetEstablishmentSettings } from '@contexts/establishment/establishment/application/get-settings/get-establishment-settings'
import {
  EstablishmentSettingsPort,
  OrderEstablishmentSettings
} from '../../application/ports/establishment-settings.port'

@Injectable()
export class TypeOrmEstablishmentSettingsAdapter extends EstablishmentSettingsPort {
  constructor(private readonly getSettings: GetEstablishmentSettings) {
    super()
  }

  async resolve(): Promise<OrderEstablishmentSettings> {
    const settings = await this.getSettings.run()
    return {
      currency: settings.defaultCurrency,
      taxRate: settings.defaultTaxRate,
      taxType: settings.defaultTaxType,
      taxInclusive: settings.taxInclusive,
      enabledOrderTypes: settings.enabledOrderTypes,
      tipSuggestions: settings.tipSuggestions
    }
  }
}

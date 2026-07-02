import { Injectable } from '@nestjs/common'
import { GetEstablishmentSettings } from '@contexts/establishment/establishment/application/get-settings/get-establishment-settings'
import {
  BillingEstablishmentIdentity,
  BillingEstablishmentPort,
} from '@contexts/billing/invoice/application/ports/billing-establishment.port'

@Injectable()
export class BillingEstablishmentAdapter extends BillingEstablishmentPort {
  constructor(private readonly getEstablishmentSettings: GetEstablishmentSettings) {
    super()
  }

  async resolve(): Promise<BillingEstablishmentIdentity> {
    const settings = await this.getEstablishmentSettings.run()

    return {
      nit: settings.taxId,
      businessName: settings.legalName,
      address: settings.address ?? '',
      phone: settings.phone ?? '',
    }
  }
}

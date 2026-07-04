import { TaxType } from '@shared/domain/value-objects/tax-type'

export interface OrderEstablishmentSettings {
  currency: string
  taxRate: number
  taxType: TaxType
  taxInclusive: boolean
  enabledOrderTypes: string[]
}

export abstract class EstablishmentSettingsPort {
  abstract resolve(): Promise<OrderEstablishmentSettings>
}

export interface OrderEstablishmentSettings {
  currency: string
  taxRate: number
  taxType: string
  taxInclusive: boolean
}

export abstract class EstablishmentSettingsPort {
  abstract resolve(): Promise<OrderEstablishmentSettings>
}

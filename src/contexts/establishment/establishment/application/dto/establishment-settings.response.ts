import { TaxType } from '@shared/domain/value-objects/tax-type'
import { KitchenMode } from '../../domain/kitchen-mode'
import { Establishment } from '../../domain/establishment'

export class EstablishmentSettingsResponse {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly displayName: string,
    public readonly legalName: string,
    public readonly taxId: string,
    public readonly phone: string | null,
    public readonly email: string | null,
    public readonly address: string | null,
    public readonly logoUrl: string | null,
    public readonly websiteUrl: string | null,
    public readonly defaultCurrency: string,
    public readonly defaultTaxRate: number,
    public readonly defaultTaxType: TaxType,
    public readonly taxInclusive: boolean,
    public readonly kitchenMode: KitchenMode,
    public readonly receiptHeader: string | null,
    public readonly receiptFooter: string | null,
    public readonly timezone: string,
    public readonly locale: string,
    public readonly loyaltyEnabled: boolean
  ) {}

  static fromDomain(establishment: Establishment): EstablishmentSettingsResponse {
    const p = establishment.toPrimitives()
    return new EstablishmentSettingsResponse(
      p.id,
      p.name,
      p.displayName,
      p.legalName,
      p.taxId,
      p.phone,
      p.email,
      p.address,
      p.logoUrl,
      p.websiteUrl,
      p.defaultCurrency,
      p.defaultTaxRate,
      p.defaultTaxType,
      p.taxInclusive,
      p.kitchenMode,
      p.receiptHeader,
      p.receiptFooter,
      p.timezone,
      p.locale,
      p.loyaltyEnabled
    )
  }
}

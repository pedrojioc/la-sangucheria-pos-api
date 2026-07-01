import { AggregateRoot } from '@shared/domain/aggregate-root'
import { TaxType } from '@shared/domain/value-objects/tax-type'
import { EstablishmentId } from './establishment-id'
import { EstablishmentName } from './establishment-name'
import { EstablishmentDisplayName } from './establishment-display-name'
import { EstablishmentLegalName } from './establishment-legal-name'
import { EstablishmentTaxId } from './establishment-tax-id'
import { EstablishmentPhone } from './establishment-phone'
import { EstablishmentEmail } from './establishment-email'
import { EstablishmentAddress } from './establishment-address'
import { EstablishmentLogoUrl } from './establishment-logo-url'
import { EstablishmentWebsiteUrl } from './establishment-website-url'
import { EstablishmentCurrency } from './establishment-currency'
import { TaxRate } from './tax-rate'
import { TaxInclusive } from './tax-inclusive'
import { KitchenMode } from './kitchen-mode'
import { ReceiptHeader } from './receipt-header'
import { ReceiptFooter } from './receipt-footer'
import { EstablishmentTimezone } from './establishment-timezone'
import { EstablishmentLocale } from './establishment-locale'
import { LoyaltyEnabled } from './loyalty-enabled'
import { EstablishmentSettingsUpdatedEvent } from './events/establishment-settings-updated.event'
import { InvalidArgument } from '@shared/domain/exceptions/invalid-argument.exception'

export interface EstablishmentPrimitives {
  id: string
  name: string
  displayName: string
  legalName: string
  taxId: string
  phone: string | null
  email: string | null
  address: string | null
  logoUrl: string | null
  websiteUrl: string | null
  defaultCurrency: string
  defaultTaxRate: number
  defaultTaxType: TaxType
  taxInclusive: boolean
  kitchenMode: KitchenMode
  receiptHeader: string | null
  receiptFooter: string | null
  timezone: string
  locale: string
  loyaltyEnabled: boolean
}

export type EstablishmentUpdateParams = Partial<Omit<EstablishmentPrimitives, 'id'>>

export class Establishment extends AggregateRoot {
  private constructor(
    public readonly id: EstablishmentId,
    private name: EstablishmentName,
    private displayName: EstablishmentDisplayName,
    private legalName: EstablishmentLegalName,
    private taxId: EstablishmentTaxId,
    private phone: EstablishmentPhone | null,
    private email: EstablishmentEmail | null,
    private address: EstablishmentAddress | null,
    private logoUrl: EstablishmentLogoUrl | null,
    private websiteUrl: EstablishmentWebsiteUrl | null,
    private defaultCurrency: EstablishmentCurrency,
    private defaultTaxRate: TaxRate,
    private defaultTaxType: TaxType,
    private taxInclusive: TaxInclusive,
    private kitchenMode: KitchenMode,
    private receiptHeader: ReceiptHeader | null,
    private receiptFooter: ReceiptFooter | null,
    private timezone: EstablishmentTimezone,
    private locale: EstablishmentLocale,
    private loyaltyEnabled: LoyaltyEnabled
  ) {
    super()
  }

  static create(
    id: string,
    name: string,
    displayName: string,
    legalName: string,
    taxId: string,
    phone: string | null,
    email: string | null,
    address: string | null,
    logoUrl: string | null,
    websiteUrl: string | null,
    defaultCurrency: string,
    defaultTaxRate: number,
    defaultTaxType: TaxType,
    taxInclusive: boolean,
    kitchenMode: KitchenMode,
    receiptHeader: string | null,
    receiptFooter: string | null,
    timezone: string,
    locale: string,
    loyaltyEnabled: boolean
  ): Establishment {
    const establishment = Establishment.fromPrimitives({
      id,
      name,
      displayName,
      legalName,
      taxId,
      phone,
      email,
      address,
      logoUrl,
      websiteUrl,
      defaultCurrency,
      defaultTaxRate,
      defaultTaxType,
      taxInclusive,
      kitchenMode,
      receiptHeader,
      receiptFooter,
      timezone,
      locale,
      loyaltyEnabled
    })

    establishment.record(
      new EstablishmentSettingsUpdatedEvent({
        id,
        name
      })
    )

    return establishment
  }

  update(params: EstablishmentUpdateParams): Establishment {
    const current = this.toPrimitives()
    const merged = { ...current, ...params }

    const updated = Establishment.fromPrimitives(merged)

    updated.record(
      new EstablishmentSettingsUpdatedEvent({
        id: this.id.value,
        name: merged.name
      })
    )

    return updated
  }

  static fromPrimitives(primitives: EstablishmentPrimitives): Establishment {
    const kitchenModeValues = Object.values(KitchenMode) as string[]
    if (!kitchenModeValues.includes(primitives.kitchenMode as string)) {
      throw new InvalidArgument(
        `<KitchenMode> does not allow the value <${primitives.kitchenMode}>. Valid values: ${kitchenModeValues.join(', ')}`
      )
    }

    const taxTypeValues = Object.values(TaxType) as string[]
    if (!taxTypeValues.includes(primitives.defaultTaxType as string)) {
      throw new InvalidArgument(
        `<TaxType> does not allow the value <${primitives.defaultTaxType}>. Valid values: ${taxTypeValues.join(', ')}`
      )
    }

    return new Establishment(
      new EstablishmentId(primitives.id),
      new EstablishmentName(primitives.name),
      new EstablishmentDisplayName(primitives.displayName),
      new EstablishmentLegalName(primitives.legalName),
      new EstablishmentTaxId(primitives.taxId),
      primitives.phone !== null ? new EstablishmentPhone(primitives.phone) : null,
      primitives.email !== null ? new EstablishmentEmail(primitives.email) : null,
      primitives.address !== null ? new EstablishmentAddress(primitives.address) : null,
      primitives.logoUrl !== null ? new EstablishmentLogoUrl(primitives.logoUrl) : null,
      primitives.websiteUrl !== null ? new EstablishmentWebsiteUrl(primitives.websiteUrl) : null,
      new EstablishmentCurrency(primitives.defaultCurrency),
      new TaxRate(primitives.defaultTaxRate),
      primitives.defaultTaxType,
      new TaxInclusive(primitives.taxInclusive),
      primitives.kitchenMode,
      primitives.receiptHeader !== null ? new ReceiptHeader(primitives.receiptHeader) : null,
      primitives.receiptFooter !== null ? new ReceiptFooter(primitives.receiptFooter) : null,
      new EstablishmentTimezone(primitives.timezone),
      new EstablishmentLocale(primitives.locale),
      new LoyaltyEnabled(primitives.loyaltyEnabled)
    )
  }

  toPrimitives(): EstablishmentPrimitives {
    return {
      id: this.id.value,
      name: this.name.value,
      displayName: this.displayName.value,
      legalName: this.legalName.value,
      taxId: this.taxId.value,
      phone: this.phone?.value ?? null,
      email: this.email?.value ?? null,
      address: this.address?.value ?? null,
      logoUrl: this.logoUrl?.value ?? null,
      websiteUrl: this.websiteUrl?.value ?? null,
      defaultCurrency: this.defaultCurrency.value,
      defaultTaxRate: this.defaultTaxRate.value,
      defaultTaxType: this.defaultTaxType,
      taxInclusive: this.taxInclusive.value,
      kitchenMode: this.kitchenMode,
      receiptHeader: this.receiptHeader?.value ?? null,
      receiptFooter: this.receiptFooter?.value ?? null,
      timezone: this.timezone.value,
      locale: this.locale.value,
      loyaltyEnabled: this.loyaltyEnabled.value
    }
  }
}

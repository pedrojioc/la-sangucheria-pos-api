import { EventBus } from '@shared/domain/events'
import { EstablishmentRepository } from '../../domain/repositories/establishment.repository'
import { Establishment } from '../../domain/establishment'
import { EstablishmentAlreadyConfigured } from '../../domain/exceptions/establishment-already-configured.exception'
import { TaxType } from '@shared/domain/value-objects/tax-type'
import { KitchenMode } from '../../domain/kitchen-mode'

export interface InitializeEstablishmentParams {
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
  receiptHeader: string | null
  receiptFooter: string | null
  timezone: string
  locale: string
  loyaltyEnabled: boolean
}

export class InitializeEstablishment {
  constructor(
    private readonly repository: EstablishmentRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(params: InitializeEstablishmentParams): Promise<void> {
    const alreadyConfigured = await this.repository.exists()
    if (alreadyConfigured) {
      throw new EstablishmentAlreadyConfigured()
    }

    const establishment = Establishment.create(
      params.id,
      params.name,
      params.displayName,
      params.legalName,
      params.taxId,
      params.phone,
      params.email,
      params.address,
      params.logoUrl,
      params.websiteUrl,
      params.defaultCurrency,
      params.defaultTaxRate,
      params.defaultTaxType,
      params.taxInclusive,
      KitchenMode.NONE,
      params.receiptHeader,
      params.receiptFooter,
      params.timezone,
      params.locale,
      params.loyaltyEnabled
    )

    await this.repository.save(establishment)
    await this.eventBus.publish(establishment.pullDomainEvents())
  }
}

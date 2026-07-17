import {
  Establishment,
  EstablishmentPrimitives
} from '@contexts/establishment/establishment/domain/establishment'
import { TaxType } from '@shared/domain/value-objects/tax-type'
import { KitchenMode } from '@contexts/establishment/establishment/domain/kitchen-mode'

// Fixed v4 UUID used as the singleton establishment ID in tests
const DEFAULT_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

const COLOMBIAN_DEFAULTS: EstablishmentPrimitives = {
  id: DEFAULT_ID,
  name: 'Mi Establecimiento',
  displayName: 'Mi Establecimiento',
  legalName: 'Mi Establecimiento S.A.S.',
  taxId: '900000001-1',
  phone: null,
  email: null,
  address: null,
  logoUrl: null,
  websiteUrl: null,
  defaultCurrency: 'COP',
  defaultTaxRate: 0.08,
  defaultTaxType: TaxType.INC,
  taxInclusive: true,
  kitchenMode: KitchenMode.NONE,
  receiptHeader: null,
  receiptFooter: null,
  timezone: 'America/Bogota',
  locale: 'es-CO',
  loyaltyEnabled: false,
  operatingHours: null,
  enabledOrderTypes: ['DINE_IN', 'DELIVERY', 'TAKEOUT'],
  serviceCharge: null,
  tipSuggestions: null,
  splitCheck: false,
  paymentMethods: ['CASH', 'CARD'],
  autoSendToKitchen: false
}

export class EstablishmentMother {
  static create(overrides: Partial<EstablishmentPrimitives> = {}): Establishment {
    return Establishment.fromPrimitives({ ...COLOMBIAN_DEFAULTS, ...overrides })
  }

  static withKitchenMode(mode: KitchenMode): Establishment {
    return EstablishmentMother.create({ kitchenMode: mode })
  }

  static withLoyaltyEnabled(): Establishment {
    return EstablishmentMother.create({ loyaltyEnabled: true })
  }

  static withEnabledOrderTypes(types: string[]): Establishment {
    return EstablishmentMother.create({ enabledOrderTypes: types })
  }

  static withDisabledOrderType(disabledType: string): Establishment {
    const all = ['DINE_IN', 'DELIVERY', 'TAKEOUT']
    return EstablishmentMother.create({ enabledOrderTypes: all.filter(t => t !== disabledType) })
  }

  static withAutoSendToKitchen(value: boolean): Establishment {
    return EstablishmentMother.create({ autoSendToKitchen: value })
  }
}

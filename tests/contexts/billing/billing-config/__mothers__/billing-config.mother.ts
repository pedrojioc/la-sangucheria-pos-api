import { faker } from '@faker-js/faker'
import {
  BillingConfig,
  BillingConfigPrimitives
} from '@contexts/billing/billing-config/domain/billing-config'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

export class BillingConfigMother {
  static primitives(params: Partial<BillingConfigPrimitives> = {}): BillingConfigPrimitives {
    const validFrom = faker.date.past({ years: 1 })
    const validTo = faker.date.future({ years: 1 })
    return {
      id: params.id ?? UuidMother.random(),
      factusApiToken: params.factusApiToken ?? faker.string.alphanumeric(32),
      factusApiBaseUrl: params.factusApiBaseUrl ?? 'https://api-sandbox.factus.com.co',
      factusTestMode: params.factusTestMode ?? true,
      resolucionPrefix: params.resolucionPrefix ?? 'SETP',
      resolucionFrom: params.resolucionFrom ?? 1,
      resolucionTo: params.resolucionTo ?? 1000,
      resolucionValidFrom: params.resolucionValidFrom ?? validFrom,
      resolucionValidTo: params.resolucionValidTo ?? validTo,
      updatedAt: params.updatedAt ?? new Date()
    }
  }

  static create(params: Partial<BillingConfigPrimitives> = {}): BillingConfig {
    const p = this.primitives(params)
    return BillingConfig.create(
      p.id,
      p.factusApiToken,
      p.factusApiBaseUrl,
      p.factusTestMode,
      p.resolucionPrefix,
      p.resolucionFrom,
      p.resolucionTo,
      p.resolucionValidFrom,
      p.resolucionValidTo
    )
  }

  static fromPrimitives(params: Partial<BillingConfigPrimitives> = {}): BillingConfig {
    return BillingConfig.fromPrimitives(this.primitives(params))
  }

  static withInvalidRange(): { from: number; to: number } {
    return { from: 1000, to: 1 }
  }
}

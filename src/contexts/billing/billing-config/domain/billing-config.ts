import { AggregateRoot } from '@shared/domain/aggregate-root'
import { BillingConfigId } from './billing-config-id'
import { FactusApiToken } from './factus-api-token'
import { FactusApiBaseUrl } from './factus-api-base-url'
import { ResolucionPrefix } from './resolucion-prefix'
import { ResolucionNumber } from './resolucion-number'
import { ResolucionValidityDate } from './resolucion-validity-date'
import { TestMode } from './test-mode'
import { InvalidResolucionRange } from './exceptions/invalid-resolucion-range.exception'
import { BillingConfigUpdatedEvent } from './events/billing-config-updated.event'

export interface BillingConfigPrimitives {
  id: string
  factusApiToken: string
  factusApiBaseUrl: string
  factusTestMode: boolean
  resolucionPrefix: string
  resolucionFrom: number
  resolucionTo: number
  resolucionValidFrom: Date
  resolucionValidTo: Date
  updatedAt: Date
}

export type BillingConfigUpdateParams = Partial<Omit<BillingConfigPrimitives, 'id' | 'updatedAt'>>

export class BillingConfig extends AggregateRoot {
  private constructor(
    public readonly id: BillingConfigId,
    private factusApiToken: FactusApiToken,
    private factusApiBaseUrl: FactusApiBaseUrl,
    private factusTestMode: TestMode,
    private resolucionPrefix: ResolucionPrefix,
    private resolucionFrom: ResolucionNumber,
    private resolucionTo: ResolucionNumber,
    private resolucionValidFrom: ResolucionValidityDate,
    private resolucionValidTo: ResolucionValidityDate,
    private readonly updatedAt: Date
  ) {
    super()
  }

  static create(
    id: string,
    factusApiToken: string,
    factusApiBaseUrl: string,
    factusTestMode: boolean,
    resolucionPrefix: string,
    resolucionFrom: number,
    resolucionTo: number,
    resolucionValidFrom: Date,
    resolucionValidTo: Date
  ): BillingConfig {
    BillingConfig.assertValidRange(resolucionFrom, resolucionTo)

    return new BillingConfig(
      new BillingConfigId(id),
      new FactusApiToken(factusApiToken),
      new FactusApiBaseUrl(factusApiBaseUrl),
      new TestMode(factusTestMode),
      new ResolucionPrefix(resolucionPrefix),
      new ResolucionNumber(resolucionFrom),
      new ResolucionNumber(resolucionTo),
      new ResolucionValidityDate(resolucionValidFrom),
      new ResolucionValidityDate(resolucionValidTo),
      new Date()
    )
  }

  update(params: BillingConfigUpdateParams): BillingConfig {
    const current = this.toPrimitives()
    const merged = { ...current, ...params }

    BillingConfig.assertValidRange(merged.resolucionFrom, merged.resolucionTo)

    const updated = new BillingConfig(
      new BillingConfigId(merged.id),
      new FactusApiToken(merged.factusApiToken),
      new FactusApiBaseUrl(merged.factusApiBaseUrl),
      new TestMode(merged.factusTestMode),
      new ResolucionPrefix(merged.resolucionPrefix),
      new ResolucionNumber(merged.resolucionFrom),
      new ResolucionNumber(merged.resolucionTo),
      new ResolucionValidityDate(merged.resolucionValidFrom),
      new ResolucionValidityDate(merged.resolucionValidTo),
      new Date()
    )

    updated.record(new BillingConfigUpdatedEvent({ id: merged.id }))

    return updated
  }

  isResolucionValid(at: Date): boolean {
    return at >= this.resolucionValidFrom.value && at <= this.resolucionValidTo.value
  }

  static fromPrimitives(p: BillingConfigPrimitives): BillingConfig {
    BillingConfig.assertValidRange(p.resolucionFrom, p.resolucionTo)

    return new BillingConfig(
      new BillingConfigId(p.id),
      new FactusApiToken(p.factusApiToken),
      new FactusApiBaseUrl(p.factusApiBaseUrl),
      new TestMode(p.factusTestMode),
      new ResolucionPrefix(p.resolucionPrefix),
      new ResolucionNumber(p.resolucionFrom),
      new ResolucionNumber(p.resolucionTo),
      new ResolucionValidityDate(p.resolucionValidFrom),
      new ResolucionValidityDate(p.resolucionValidTo),
      p.updatedAt
    )
  }

  toPrimitives(): BillingConfigPrimitives {
    return {
      id: this.id.value,
      factusApiToken: this.factusApiToken.value,
      factusApiBaseUrl: this.factusApiBaseUrl.value,
      factusTestMode: this.factusTestMode.value,
      resolucionPrefix: this.resolucionPrefix.value,
      resolucionFrom: this.resolucionFrom.value,
      resolucionTo: this.resolucionTo.value,
      resolucionValidFrom: this.resolucionValidFrom.value,
      resolucionValidTo: this.resolucionValidTo.value,
      updatedAt: this.updatedAt
    }
  }

  private static assertValidRange(from: number, to: number): void {
    if (from > to) {
      throw new InvalidResolucionRange(from, to)
    }
  }
}

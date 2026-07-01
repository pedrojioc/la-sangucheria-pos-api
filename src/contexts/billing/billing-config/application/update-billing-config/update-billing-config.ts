import { EventBus } from '@shared/domain/events'
import { BillingConfig, BillingConfigUpdateParams } from '../../domain/billing-config'
import { BillingConfigRepository } from '../../domain/repositories/billing-config.repository'
import { BillingNotConfigured } from '../../domain/exceptions/billing-not-configured.exception'

export interface UpdateBillingConfigParams {
  id: string
  factusApiToken: string
  factusApiBaseUrl: string
  factusTestMode: boolean
  resolucionPrefix: string
  resolucionFrom: number
  resolucionTo: number
  resolucionValidFrom: Date
  resolucionValidTo: Date
}

export class UpdateBillingConfig {
  constructor(
    private readonly repository: BillingConfigRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(params: UpdateBillingConfigParams): Promise<void> {
    let config: BillingConfig

    try {
      const existing = await this.repository.findSingleton()
      const updateParams: BillingConfigUpdateParams = {
        factusApiToken: params.factusApiToken,
        factusApiBaseUrl: params.factusApiBaseUrl,
        factusTestMode: params.factusTestMode,
        resolucionPrefix: params.resolucionPrefix,
        resolucionFrom: params.resolucionFrom,
        resolucionTo: params.resolucionTo,
        resolucionValidFrom: params.resolucionValidFrom,
        resolucionValidTo: params.resolucionValidTo
      }
      config = existing.update(updateParams)
    } catch (error) {
      if (error instanceof BillingNotConfigured) {
        config = BillingConfig.create(
          params.id,
          params.factusApiToken,
          params.factusApiBaseUrl,
          params.factusTestMode,
          params.resolucionPrefix,
          params.resolucionFrom,
          params.resolucionTo,
          params.resolucionValidFrom,
          params.resolucionValidTo
        )
      } else {
        throw error
      }
    }

    await this.repository.save(config)
    await this.eventBus.publish(config.pullDomainEvents())
  }
}

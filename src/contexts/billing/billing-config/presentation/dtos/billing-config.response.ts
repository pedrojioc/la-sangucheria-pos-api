import { BillingConfigPrimitives } from '@contexts/billing/billing-config/domain/billing-config'

export class BillingConfigResponse {
  factusApiToken: string
  factusApiBaseUrl: string
  factusTestMode: boolean
  resolucionPrefix: string
  resolucionFrom: number
  resolucionTo: number
  resolucionValidFrom: string
  resolucionValidTo: string
  updatedAt: string

  static fromPrimitives(primitives: BillingConfigPrimitives): BillingConfigResponse {
    const response = new BillingConfigResponse()
    response.factusApiToken = primitives.factusApiToken
    response.factusApiBaseUrl = primitives.factusApiBaseUrl
    response.factusTestMode = primitives.factusTestMode
    response.resolucionPrefix = primitives.resolucionPrefix
    response.resolucionFrom = primitives.resolucionFrom
    response.resolucionTo = primitives.resolucionTo
    response.resolucionValidFrom = primitives.resolucionValidFrom.toISOString()
    response.resolucionValidTo = primitives.resolucionValidTo.toISOString()
    response.updatedAt = primitives.updatedAt.toISOString()
    return response
  }
}

export class UpdateBillingConfigRequest {
  factusApiToken: string
  factusApiBaseUrl: string
  factusTestMode: boolean
  resolucionPrefix: string
  resolucionFrom: number
  resolucionTo: number
  resolucionValidFrom: string
  resolucionValidTo: string
}

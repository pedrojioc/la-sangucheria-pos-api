import { BillingConfig } from '../billing-config'

export abstract class BillingConfigRepository {
  abstract findSingleton(): Promise<BillingConfig>
  abstract save(config: BillingConfig): Promise<void>
}

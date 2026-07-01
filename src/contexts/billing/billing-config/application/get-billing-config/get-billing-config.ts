import { BillingConfigRepository } from '../../domain/repositories/billing-config.repository'
import { BillingConfigPrimitives } from '../../domain/billing-config'

export class GetBillingConfig {
  constructor(private readonly repository: BillingConfigRepository) {}

  async run(): Promise<BillingConfigPrimitives> {
    const config = await this.repository.findSingleton()
    return config.toPrimitives()
  }
}

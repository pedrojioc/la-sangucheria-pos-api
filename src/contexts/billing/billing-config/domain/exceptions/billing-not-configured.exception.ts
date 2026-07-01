import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class BillingNotConfigured extends DomainException {
  constructor() {
    super('Billing is not configured. Use the PUT /billing/config endpoint to set up Factus credentials.')
    this.name = 'BillingNotConfigured'
  }
}

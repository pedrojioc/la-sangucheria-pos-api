import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class BillingNotConfigured extends NotFoundException {
  constructor() {
    super(
      'Billing is not configured. Use the PUT /billing/config endpoint to set up Factus credentials.'
    )
    this.name = 'BillingNotConfigured'
  }
}

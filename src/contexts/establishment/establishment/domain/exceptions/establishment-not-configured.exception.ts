import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class EstablishmentNotConfigured extends DomainException {
  constructor() {
    super('Establishment is not configured. Run the database migration to seed initial settings.')
    this.name = 'EstablishmentNotConfigured'
  }
}

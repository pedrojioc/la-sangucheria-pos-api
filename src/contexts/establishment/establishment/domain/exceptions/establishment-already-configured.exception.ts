import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class EstablishmentAlreadyConfigured extends DomainException {
  constructor() {
    super('Establishment is already configured. Use PATCH /establishment/settings to update it.')
    this.name = 'EstablishmentAlreadyConfigured'
  }
}

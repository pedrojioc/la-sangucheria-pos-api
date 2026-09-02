import { DomainException } from '@shared/domain/exceptions/domain.exception'

export class EstablishmentNotConfigured extends DomainException {
  constructor() {
    super(
      'Establishment is not configured. Complete the setup wizard via POST /establishment/settings.'
    )
    this.name = 'EstablishmentNotConfigured'
  }
}

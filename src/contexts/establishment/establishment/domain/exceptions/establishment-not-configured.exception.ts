import { NotFoundException } from '@shared/domain/exceptions/domain.exception'

export class EstablishmentNotConfigured extends NotFoundException {
  constructor() {
    super(
      'Establishment is not configured. Complete the setup wizard via POST /establishment/settings.'
    )
    this.name = 'EstablishmentNotConfigured'
  }
}

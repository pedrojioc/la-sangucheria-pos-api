import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class KitchenTicketPrintJobNotReprintable extends BusinessRuleViolationException {
  constructor(id: string) {
    super(`Kitchen ticket print job with id ${id} is already printed and cannot be reprinted`)
  }
}

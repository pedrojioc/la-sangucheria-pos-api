import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OrderPaymentMismatch extends BusinessRuleViolationException {
  constructor(expected: number, received: number, currency: string) {
    super(
      `El total de los pagos (${received} ${currency}) no coincide con el total de la orden (${expected} ${currency})`
    )
  }
}

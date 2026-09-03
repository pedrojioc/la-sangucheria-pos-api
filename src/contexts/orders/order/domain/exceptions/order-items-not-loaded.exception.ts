import { BusinessRuleViolationException } from '@shared/domain/exceptions/domain.exception'

export class OrderItemsNotLoaded extends BusinessRuleViolationException {
  constructor(orderId: string) {
    super(
      `Order items relation was not loaded for order ${orderId}. ` +
        'This indicates a repository read path that forgot to load order_items — fix the query, ' +
        'do not default to an empty array.'
    )
  }
}

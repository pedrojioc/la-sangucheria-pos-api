import { DomainException } from './domain.exception'

/**
 * MissingUnitOfWorkContext
 *
 * Thrown by EventBusRouter when a category-1 (synchronous) subscriber is
 * dispatched with no ambient UnitOfWorkContext available (no
 * @UseInterceptors(TransactionInterceptor) on the originating endpoint).
 *
 * A category-1 subscriber runs synchronously INSIDE the publisher's
 * transaction — with no transaction there is nothing to join. This fails
 * loudly instead of silently degrading to fire-and-forget, per design D5/D8.
 */
export class MissingUnitOfWorkContext extends DomainException {
  constructor(subscriberName: string, eventName: string) {
    super(
      `Category-1 subscriber "${subscriberName}" was dispatched for event ` +
        `"${eventName}" with no ambient UnitOfWorkContext. Add ` +
        '@UseInterceptors(TransactionInterceptor) to the endpoint that publishes this event.'
    )
  }
}

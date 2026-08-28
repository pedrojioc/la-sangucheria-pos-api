import { EntityManager } from 'typeorm'

import { DomainEvent } from '@shared/domain/events/domain-event'

/**
 * UnitOfWorkContext
 *
 * ALS store shape shared by the TransactionInterceptor, every
 * TransactionalRepository, and the EventBusRouter.
 *
 * - manager: the ambient TypeORM EntityManager bound to the currently open
 *   transaction. Repositories resolve their Repository<T> from this manager
 *   when present.
 * - pending: cascade queue of events published from within a category-1
 *   subscriber while dispatch is already in progress. Drained in FIFO order
 *   at the top-level EventBusRouter.publish() frame.
 * - depth: cascade generation counter, guarded by MAX_CASCADE_DEPTH.
 */
export interface UnitOfWorkContext {
  readonly manager: EntityManager
  pending: DomainEvent[]
  depth: number
}

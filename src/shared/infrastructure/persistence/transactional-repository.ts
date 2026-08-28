import { EntityManager, ObjectLiteral, Repository } from 'typeorm'

import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'

/**
 * TransactionalRepository
 *
 * ALS-aware abstract base class for TypeORM repository implementations.
 * Every `TypeOrmXxxRepository` extends this (Slice 5 retrofit) and uses
 * `this.repo` instead of the constructor-injected `Repository<T>` directly.
 *
 * Resolution rule: if a UnitOfWorkContext is ambient (a TransactionInterceptor
 * opened a transaction for this request), resolve the Repository<E>/EntityManager
 * from that context's manager so all writes enlist in the same transaction.
 * Otherwise fall back to the constructor-injected default repository — this
 * is what keeps unit tests (which never run inside `holder.run()`) unaffected:
 * they construct the repository directly and mock the injected `Repository<T>`.
 */
export abstract class TransactionalRepository<E extends ObjectLiteral> {
  protected constructor(
    private readonly defaultRepository: Repository<E>,
    private readonly uow: UnitOfWorkContextHolder
  ) {}

  protected get repo(): Repository<E> {
    const manager = this.uow.currentManager()
    return manager
      ? manager.getRepository<E>(this.defaultRepository.target)
      : this.defaultRepository
  }

  protected get manager(): EntityManager {
    return this.uow.currentManager() ?? this.defaultRepository.manager
  }
}

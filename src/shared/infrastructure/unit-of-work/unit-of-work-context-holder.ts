import { AsyncLocalStorage } from 'node:async_hooks'
import { Injectable } from '@nestjs/common'
import { EntityManager } from 'typeorm'

import { UnitOfWorkContext } from './unit-of-work-context'

/**
 * UnitOfWorkContextHolder
 *
 * Thin wrapper around AsyncLocalStorage<UnitOfWorkContext>. This is the
 * single source of ambient-transaction truth read by TransactionalRepository
 * and EventBusRouter — both must observe the exact same context instance so
 * that nested repository saves and nested event publishes enlist in the
 * same open transaction.
 */
@Injectable()
export class UnitOfWorkContextHolder {
  private readonly storage = new AsyncLocalStorage<UnitOfWorkContext>()

  run<T>(context: UnitOfWorkContext, callback: () => T): T {
    return this.storage.run(context, callback)
  }

  current(): UnitOfWorkContext | undefined {
    return this.storage.getStore()
  }

  currentManager(): EntityManager | undefined {
    return this.storage.getStore()?.manager
  }
}

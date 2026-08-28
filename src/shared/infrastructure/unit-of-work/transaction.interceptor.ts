import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { Observable, from } from 'rxjs'
import { DataSource } from 'typeorm'

import { UnitOfWorkContextHolder } from './unit-of-work-context-holder'
import { UnitOfWorkContext } from './unit-of-work-context'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

const isMutatingRequest = (method: string): boolean => MUTATING_METHODS.has(method.toUpperCase())

/**
 * TransactionInterceptor
 *
 * Opens one TypeORM transaction per mutating HTTP request (POST/PUT/PATCH/
 * DELETE) and stores the transactional EntityManager in the ALS-backed
 * UnitOfWorkContextHolder for the duration of the request. GET/HEAD requests
 * bypass entirely — no transaction opened, no ALS context set.
 *
 * NOTE (design D5, reversed in v2): this interceptor is applied OPT-IN, per
 * controller method, via explicit `@UseInterceptors(TransactionInterceptor)`
 * — it is NEVER registered as a global APP_INTERCEPTOR. The developer
 * authoring or reviewing a use case is responsible for recognizing when
 * chained mutations need shared atomicity and applying it explicitly (Slice
 * 6). Any endpoint whose use case publishes an event with a registered
 * category-1 subscriber MUST carry this interceptor, or the router throws
 * MissingUnitOfWorkContext.
 */
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly uow: UnitOfWorkContextHolder
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ method: string }>()

    if (!isMutatingRequest(request.method)) {
      return next.handle()
    }

    return from(
      this.dataSource.transaction(manager => {
        const uowContext: UnitOfWorkContext = { manager, pending: [], depth: 0 }
        return this.uow.run(uowContext, () => this.toPromise(next))
      })
    )
  }

  private toPromise(next: CallHandler): Promise<unknown> {
    return new Promise((resolve, reject) => {
      next.handle().subscribe({
        next: value => resolve(value),
        error: error => reject(error)
      })
    })
  }
}

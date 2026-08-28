import { Global, Module } from '@nestjs/common'

import { UnitOfWorkContextHolder } from './unit-of-work-context-holder'

/**
 * UnitOfWorkModule
 *
 * Provides UnitOfWorkContextHolder application-wide. Per design D5 (v2,
 * reversed from the original global-activation plan), TransactionInterceptor
 * is intentionally NEVER registered as an APP_INTERCEPTOR here — it is
 * applied opt-in, per controller method, via explicit
 * `@UseInterceptors(TransactionInterceptor)` (Slice 6), after every TypeORM
 * repository was retrofitted to be ALS-aware (Slice 5).
 */
@Global()
@Module({
  providers: [UnitOfWorkContextHolder],
  exports: [UnitOfWorkContextHolder]
})
export class UnitOfWorkModule {}

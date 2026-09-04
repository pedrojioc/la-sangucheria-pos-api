import { Test, TestingModule } from '@nestjs/testing'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AppModule } from '@/app.module'
import { WorkerModule } from '@/worker.module'
import { EnvConfigModule } from '@/config/env/env.config'
import { DatabaseModule } from '@/config/database/database.module'
import appConfig from '@/config/app.config'
import { SharedInfrastructureModule } from '@shared/infrastructure/shared-infrastructure.module'
import { KitchenPrinterModule } from '@contexts/kitchen-operations/kitchen-printer/kitchen-printer.module'
import { EventBusRouter } from '@shared/infrastructure/event-bus/event-bus.router'
import {
  DISPATCH_CATEGORIES,
  DEFAULT_CATEGORY,
  DispatchCategory,
  SubscriberClass
} from '@shared/infrastructure/event-bus/dispatch-category.registry'

/**
 * Differential deferred-coverage safety net (Slice: outbox-worker-process,
 * design D2, spec requirement "Missing worker coverage for a deferred
 * subscriber MUST fail at build/test time").
 *
 * WHY E2E, NOT UNIT: this test must `init()` (not just `compile()`) BOTH
 * AppModule and WorkerModule to let each module's OnModuleInit populate its
 * own EventBusRouter with real, DI-resolved subscribers — that's the only
 * way to observe the runtime registration surface, since there is no static
 * subscriber→module map anywhere in the codebase. AppModule needs the real
 * DataSource DatabaseModule.forRootAsync builds against — the ephemeral
 * Testcontainers-backed Postgres started in `tests/e2e/support/
 * global-setup.ts`, not a locally running Postgres instance — so this cannot
 * live in the unit project (no DB, ts-jest `unit` project only mocks
 * repositories). Runs under `pnpm test:all` / `pnpm test:e2e`, NOT
 * `pnpm test` (unit).
 *
 * MECHANISM: compile + init() both modules, read each EventBusRouter's
 * registeredSubscribers(), filter to only those resolving to
 * DispatchCategory.Deferred via the SAME `DISPATCH_CATEGORIES.get(ctor) ??
 * DEFAULT_CATEGORY` expression the router uses internally (so this also
 * catches an unregistered subscriber falling through to DEFAULT_CATEGORY,
 * not just explicit Deferred entries), and assert
 * appDeferredNames \ workerDeferredNames === [].
 *
 * KNOWN LIMITATION (accepted, per design): this compares against AppModule,
 * so a deferred subscriber registered by a module imported by NEITHER graph
 * is invisible here — such a subscriber is already dead in production, a
 * separate defect from what this test guards against. REGISTERED_OUTBOX_EVENTS
 * rehydration coverage is likewise a separate, out-of-scope gap.
 */

function deferredSubscriberNames(router: EventBusRouter): Set<string> {
  return new Set(
    router
      .registeredSubscribers()
      .filter(
        subscriber =>
          (DISPATCH_CATEGORIES.get(subscriber.constructor as SubscriberClass) ??
            DEFAULT_CATEGORY) === DispatchCategory.Deferred
      )
      .map(subscriber => subscriber.constructor.name)
  )
}

describe('Worker deferred-subscriber coverage (e2e safety net)', () => {
  let appModuleFixture: TestingModule
  let workerModuleFixture: TestingModule

  beforeAll(async () => {
    appModuleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile()
    await appModuleFixture.init()

    workerModuleFixture = await Test.createTestingModule({ imports: [WorkerModule] }).compile()
    await workerModuleFixture.init()
  })

  afterAll(async () => {
    await appModuleFixture.close()
    await workerModuleFixture.close()
  })

  it('every Deferred subscriber (explicit or DEFAULT_CATEGORY fallthrough) registered in AppModule is also registered in WorkerModule', () => {
    const appRouter = appModuleFixture.get(EventBusRouter)
    const workerRouter = workerModuleFixture.get(EventBusRouter)

    const appDeferred = deferredSubscriberNames(appRouter)
    const workerDeferred = deferredSubscriberNames(workerRouter)

    const missingFromWorker = [...appDeferred].filter(name => !workerDeferred.has(name))

    expect(missingFromWorker).toEqual([])
  })
})

/**
 * Negative-path proof (design D2 / tasks 5.2): confirms the comparison logic
 * above actually fails when worker coverage is incomplete, rather than
 * vacuously passing no matter what. Builds a deliberately-broken
 * WorkerModule-like test module that omits InvoiceModule (so
 * IssueBillingDocumentOnOrderClosed, a Deferred subscriber, is never
 * registered) and asserts the SAME set-difference logic reports it missing.
 *
 * This sub-suite is intentionally retained (not deleted after manual
 * verification) — it's the automated proof that the safety net has teeth.
 */
@Module({
  imports: [
    EnvConfigModule,
    ConfigModule.forFeature(appConfig),
    DatabaseModule,
    SharedInfrastructureModule,
    KitchenPrinterModule
    // InvoiceModule deliberately omitted — this is the negative case.
  ]
})
class BrokenWorkerModuleMissingInvoice {}

describe('Worker deferred-subscriber coverage — negative-path proof (guard actually fails)', () => {
  let appModuleFixture: TestingModule
  let brokenWorkerFixture: TestingModule

  beforeAll(async () => {
    appModuleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile()
    await appModuleFixture.init()

    brokenWorkerFixture = await Test.createTestingModule({
      imports: [BrokenWorkerModuleMissingInvoice]
    }).compile()
    await brokenWorkerFixture.init()
  })

  afterAll(async () => {
    await appModuleFixture.close()
    await brokenWorkerFixture.close()
  })

  it('reports IssueBillingDocumentOnOrderClosed as missing when the module owning it is not imported', () => {
    const appRouter = appModuleFixture.get(EventBusRouter)
    const brokenWorkerRouter = brokenWorkerFixture.get(EventBusRouter)

    const appDeferred = deferredSubscriberNames(appRouter)
    const brokenWorkerDeferred = deferredSubscriberNames(brokenWorkerRouter)

    const missingFromWorker = [...appDeferred].filter(name => !brokenWorkerDeferred.has(name))

    expect(missingFromWorker).toContain('IssueBillingDocumentOnOrderClosed')
  })
})

import { Global, Module } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm'

import { InMemoryEventBusModule } from '@shared/infrastructure/event-bus/in-memory/in-memory-event-bus.module'
import { EventBus } from '@shared/domain/events'
import { EventBusRouter } from '@shared/infrastructure/event-bus/event-bus.router'
import { UnitOfWorkModule } from '@shared/infrastructure/unit-of-work/unit-of-work.module'
import { EventStoreModule } from '@shared/infrastructure/event-sourcing/event-store.module'
import { EventStoreService } from '@shared/infrastructure/event-sourcing/event-store.service'
import { EventStoreEntity } from '@shared/infrastructure/event-sourcing/persistence/event-store.entity'
import { EventRegistry } from '@shared/infrastructure/event-sourcing/event-registry'

/**
 * Test-only stand-in for the real EventStoreModule (which pulls in
 * TypeOrmModule.forFeature() and needs a live DataSource). Provides the
 * same exported tokens (EventStoreService, EventRegistry) as fakes so
 * InMemoryEventBusModule's real `imports: [EventStoreModule]` (added once
 * EventBusRouter started depending on EventStoreService/DataSource
 * directly) resolves without a database.
 */
@Global()
@Module({
  providers: [
    { provide: getDataSourceToken(), useValue: {} },
    { provide: getRepositoryToken(EventStoreEntity), useValue: {} },
    { provide: EventStoreService, useValue: { appendInTransaction: jest.fn() } },
    { provide: EventRegistry, useValue: { register: jest.fn(), resolve: jest.fn() } }
  ],
  exports: [getDataSourceToken(), EventStoreService, EventRegistry]
})
class FakeEventStoreModule {}

describe('InMemoryEventBusModule', () => {
  it('resolves the EventBus abstract token to an EventBusRouter instance', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UnitOfWorkModule, InMemoryEventBusModule]
    })
      .overrideModule(EventStoreModule)
      .useModule(FakeEventStoreModule)
      .compile()

    const eventBus = moduleRef.get(EventBus)

    expect(eventBus).toBeInstanceOf(EventBusRouter)
  })

  it('no longer imports EventEmitterModule and no longer provides EventEmitter2', () => {
    const moduleImports = (Reflect.getMetadata('imports', InMemoryEventBusModule) ?? []) as Array<
      { module?: { name?: string }; name?: string } | undefined
    >
    const moduleProviders = (Reflect.getMetadata('providers', InMemoryEventBusModule) ??
      []) as unknown[]

    const importsEventEmitterModule = moduleImports.some(
      imported =>
        imported?.module?.name === 'EventEmitterModule' || imported?.name === 'EventEmitterModule'
    )
    const providesEventEmitter2 = moduleProviders.some(
      provider => (provider as { name?: string })?.name === 'EventEmitter2'
    )

    expect(importsEventEmitterModule).toBe(false)
    expect(providesEventEmitter2).toBe(false)
  })
})

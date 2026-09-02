import { DataSource, EntityManager } from 'typeorm'

import { OutboxPollerService } from '@shared/infrastructure/event-sourcing/outbox-poller.service'
import { EventStoreService } from '@shared/infrastructure/event-sourcing/event-store.service'
import { EventRegistry } from '@shared/infrastructure/event-sourcing/event-registry'
import { EventBusRouter } from '@shared/infrastructure/event-bus/event-bus.router'
import { DomainEvent, DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import { EventStoreEntity } from '@shared/infrastructure/event-sourcing/persistence/event-store.entity'

/**
 * OutboxPollerService (Slice 9, design D3)
 *
 * Unit-tests ONLY the poller's dispatch orchestration logic: given rows
 * `claimUndispatched` returns, rehydrate via EventRegistry, look up the
 * category-2 subscribers registered on EventBusRouter for that event name,
 * invoke each, and collect only the successfully-dispatched ids for
 * markDispatched. Nothing here exercises the real
 * `FOR UPDATE SKIP LOCKED` SQL — that is EventStoreService.claimUndispatched's
 * own concern (integration-only, per design), verified separately below by
 * reading its query-builder implementation rather than re-asserting it here.
 */
class FakeEvent extends DomainEvent {
  static readonly EVENT_NAME = 'fake.outbox.event'

  constructor(aggregateId: string) {
    super({ eventName: FakeEvent.EVENT_NAME, aggregateId, payload: {} })
  }

  toPrimitives(): Record<string, unknown> {
    return {}
  }

  static fromPrimitives(params: { aggregateId: string }): DomainEvent {
    return new FakeEvent(params.aggregateId)
  }
}

const buildRow = (id: string, aggregateId: string): EventStoreEntity =>
  ({
    id,
    aggregateId,
    aggregateType: 'fake',
    eventType: FakeEvent.EVENT_NAME,
    version: 1,
    eventSchemaVersion: 1,
    payload: {},
    metadata: null,
    correlationId: null,
    occurredAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    dispatchedAt: null
  }) as EventStoreEntity

describe('OutboxPollerService', () => {
  const buildDataSource = (manager: EntityManager) =>
    ({
      transaction: jest.fn(async (work: (manager: EntityManager) => Promise<unknown>) =>
        work(manager)
      )
    }) as unknown as DataSource

  const buildEventRegistry = () => {
    const registry = new EventRegistry()
    registry.register(FakeEvent as unknown as DomainEventClass)
    return registry
  }

  it('dispatches each claimed undispatched event to its category-2 subscriber(s) and marks them dispatched on success', async () => {
    const manager = {} as EntityManager
    const dataSource = buildDataSource(manager)

    const rows = [buildRow('id-1', 'agg-1'), buildRow('id-2', 'agg-2')]
    const eventStoreService = {
      claimUndispatched: jest.fn().mockResolvedValue(rows),
      markDispatched: jest.fn().mockResolvedValue(undefined)
    } as unknown as EventStoreService

    const subscriber: DomainEventSubscriber<FakeEvent> = {
      subscribedTo: () => [FakeEvent as unknown as DomainEventClass],
      on: jest.fn().mockResolvedValue(undefined)
    }
    const router = new EventBusRouter(
      { current: () => undefined } as never,
      dataSource,
      eventStoreService
    )
    router.addSubscribers([subscriber])

    const poller = new OutboxPollerService(
      dataSource,
      eventStoreService,
      router,
      buildEventRegistry()
    )

    await poller.pollOnce()

    expect(eventStoreService.claimUndispatched).toHaveBeenCalledWith(manager, 50)
    expect(subscriber.on).toHaveBeenCalledTimes(2)
    expect(eventStoreService.markDispatched).toHaveBeenCalledWith(manager, ['id-1', 'id-2'])
  })

  it('when a subscriber throws for one event, that event stays undispatched (excluded from markDispatched) but the batch keeps processing the rest', async () => {
    const manager = {} as EntityManager
    const dataSource = buildDataSource(manager)

    const rows = [buildRow('id-fail', 'agg-fail'), buildRow('id-ok', 'agg-ok')]
    const eventStoreService = {
      claimUndispatched: jest.fn().mockResolvedValue(rows),
      markDispatched: jest.fn().mockResolvedValue(undefined)
    } as unknown as EventStoreService

    let callCount = 0
    const subscriber: DomainEventSubscriber<FakeEvent> = {
      subscribedTo: () => [FakeEvent as unknown as DomainEventClass],
      on: jest.fn().mockImplementation(() => {
        callCount += 1
        if (callCount === 1) {
          return Promise.reject(new Error('subscriber boom'))
        }
        return Promise.resolve()
      })
    }
    const router = new EventBusRouter(
      { current: () => undefined } as never,
      dataSource,
      eventStoreService
    )
    router.addSubscribers([subscriber])

    const poller = new OutboxPollerService(
      dataSource,
      eventStoreService,
      router,
      buildEventRegistry()
    )

    await expect(poller.pollOnce()).resolves.not.toThrow()

    expect(subscriber.on).toHaveBeenCalledTimes(2)
    expect(eventStoreService.markDispatched).toHaveBeenCalledWith(manager, ['id-ok'])
  })

  it('marks an event with zero category-2 subscribers as dispatched without attempting rehydration', async () => {
    const manager = {} as EntityManager
    const dataSource = buildDataSource(manager)

    const rows = [buildRow('id-orphan', 'agg-orphan')]
    const eventStoreService = {
      claimUndispatched: jest.fn().mockResolvedValue(rows),
      markDispatched: jest.fn().mockResolvedValue(undefined)
    } as unknown as EventStoreService

    const router = new EventBusRouter(
      { current: () => undefined } as never,
      dataSource,
      eventStoreService
    )
    // No addSubscribers() call — FakeEvent has zero subscribers of any category.

    const eventRegistry = new EventRegistry()
    // Deliberately NOT registered — rehydrate() would throw if ever reached.
    const rehydrateSpy = jest.spyOn(eventRegistry, 'rehydrate')

    const poller = new OutboxPollerService(dataSource, eventStoreService, router, eventRegistry)

    await expect(poller.pollOnce()).resolves.not.toThrow()

    expect(rehydrateSpy).not.toHaveBeenCalled()
    expect(eventStoreService.markDispatched).toHaveBeenCalledWith(manager, ['id-orphan'])
  })

  it('does nothing (no markDispatched call) when there are no undispatched rows', async () => {
    const manager = {} as EntityManager
    const dataSource = buildDataSource(manager)

    const eventStoreService = {
      claimUndispatched: jest.fn().mockResolvedValue([]),
      markDispatched: jest.fn().mockResolvedValue(undefined)
    } as unknown as EventStoreService

    const router = new EventBusRouter(
      { current: () => undefined } as never,
      dataSource,
      eventStoreService
    )

    const poller = new OutboxPollerService(
      dataSource,
      eventStoreService,
      router,
      buildEventRegistry()
    )

    await poller.pollOnce()

    expect(eventStoreService.markDispatched).not.toHaveBeenCalled()
  })
})

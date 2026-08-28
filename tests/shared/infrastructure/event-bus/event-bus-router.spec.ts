import { DataSource, EntityManager } from 'typeorm'

import { EventBusRouter } from '@shared/infrastructure/event-bus/event-bus.router'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import { EventStoreService } from '@shared/infrastructure/event-sourcing/event-store.service'
import { DomainEvent, DomainEventClass, DomainEventSubscriber } from '@shared/domain/events'
import {
  DISPATCH_CATEGORIES,
  DispatchCategory
} from '@shared/infrastructure/event-bus/dispatch-category.registry'
import { MissingUnitOfWorkContext } from '@shared/domain/exceptions/missing-unit-of-work-context.exception'
import { EventCascadeDepthExceeded } from '@shared/domain/exceptions/event-cascade-depth-exceeded.exception'
import { OutboxRow } from '@shared/infrastructure/event-sourcing/event-store.service'

class FakeEvent extends DomainEvent {
  static readonly EVENT_NAME = 'fake.event'

  constructor(aggregateId = 'agg-1') {
    super({ eventName: FakeEvent.EVENT_NAME, aggregateId, payload: {} })
  }

  toPrimitives(): Record<string, unknown> {
    return {}
  }

  static fromPrimitives(): DomainEvent {
    throw new Error('not needed for these tests')
  }
}

/**
 * Test-only category-1 subscriber. Registered directly into the shared
 * DISPATCH_CATEGORIES map (design D6 — keyed by subscriber class) so these
 * router unit tests don't need to import any real production subscriber
 * with its own dependency chain.
 */
class FakeCategoryOneSubscriber implements DomainEventSubscriber<FakeEvent> {
  subscribedTo(): DomainEventClass[] {
    return [FakeEvent as unknown as DomainEventClass]
  }

  on(_event: FakeEvent): Promise<void> {
    void _event
    return Promise.resolve()
  }
}
DISPATCH_CATEGORIES.set(FakeCategoryOneSubscriber, DispatchCategory.Synchronous)

const buildEventStoreService = () => ({
  appendInTransaction: jest.fn((_manager: EntityManager, _rows: OutboxRow[]) => {
    void _manager
    void _rows
    return Promise.resolve(undefined)
  })
})

const buildDataSource = () => ({
  transaction: jest.fn(async (work: (manager: EntityManager) => Promise<unknown>) =>
    work({} as EntityManager)
  )
})

describe('EventBusRouter — category-1 synchronous dispatch (path A)', () => {
  it('invokes the category-1 subscriber synchronously, awaited, using the ambient manager, before publish() resolves', async () => {
    const holder = new UnitOfWorkContextHolder()
    const ambientManager = {} as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    let resolvedManagerSeenBySubscriber: EntityManager | undefined
    const subscriber = new FakeCategoryOneSubscriber()
    const onSpy = jest.spyOn(subscriber, 'on').mockImplementation(() => {
      resolvedManagerSeenBySubscriber = holder.currentManager()
      return Promise.resolve()
    })

    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    const router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )
    router.addSubscribers([subscriber])

    await holder.run(context, () => router.publish([new FakeEvent()]))

    expect(onSpy).toHaveBeenCalledTimes(1)
    expect(resolvedManagerSeenBySubscriber).toBe(ambientManager)
  })

  it('propagates a category-1 subscriber failure (rejects publish(), no swallowing) so the ambient transaction rolls back', async () => {
    const holder = new UnitOfWorkContextHolder()
    const context: UnitOfWorkContext = { manager: {} as EntityManager, pending: [], depth: 0 }

    const failure = new Error('subscriber boom')
    const subscriber = new FakeCategoryOneSubscriber()
    jest.spyOn(subscriber, 'on').mockImplementation(() => Promise.reject(failure))

    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    const router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )
    router.addSubscribers([subscriber])

    await expect(holder.run(context, () => router.publish([new FakeEvent()]))).rejects.toBe(failure)
  })
})

describe('EventBusRouter — category-1 dispatch with NO ambient context (design D5/D8)', () => {
  it('throws MissingUnitOfWorkContext and NEVER invokes the category-1 subscriber when called outside holder.run()', async () => {
    const holder = new UnitOfWorkContextHolder()
    const subscriber = new FakeCategoryOneSubscriber()
    const onSpy = jest.spyOn(subscriber, 'on')

    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    const router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )
    router.addSubscribers([subscriber])

    await expect(router.publish([new FakeEvent()])).rejects.toBeInstanceOf(MissingUnitOfWorkContext)
    expect(onSpy).not.toHaveBeenCalled()
  })

  it('throws BEFORE attempting any path-B outbox write for that event (no dataSource.transaction call)', async () => {
    const holder = new UnitOfWorkContextHolder()
    const subscriber = new FakeCategoryOneSubscriber()
    jest.spyOn(subscriber, 'on')

    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    const router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )
    router.addSubscribers([subscriber])

    await expect(router.publish([new FakeEvent()])).rejects.toBeInstanceOf(MissingUnitOfWorkContext)
    expect(dataSource.transaction).not.toHaveBeenCalled()
    expect(eventStoreService.appendInTransaction).not.toHaveBeenCalled()
  })
})

/**
 * Test-only category-2 subscriber, registered as Deferred.
 */
class FakeCategoryTwoSubscriber implements DomainEventSubscriber<FakeEvent> {
  subscribedTo(): DomainEventClass[] {
    return [FakeEvent as unknown as DomainEventClass]
  }

  on(_event: FakeEvent): Promise<void> {
    void _event
    return Promise.resolve()
  }
}
DISPATCH_CATEGORIES.set(FakeCategoryTwoSubscriber, DispatchCategory.Deferred)

describe('EventBusRouter — category-2 outbox write joining ambient transaction (path A, design D8)', () => {
  it('appends the category-2 row using the SAME ambient EntityManager (reference equality), dispatchedAt = null', async () => {
    const holder = new UnitOfWorkContextHolder()
    const ambientManager = {} as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    const subscriber = new FakeCategoryTwoSubscriber()
    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    const router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )
    router.addSubscribers([subscriber])

    await holder.run(context, () => router.publish([new FakeEvent('agg-cat2')]))

    expect(eventStoreService.appendInTransaction).toHaveBeenCalledTimes(1)
    const [managerArg, rowsArg] = eventStoreService.appendInTransaction.mock.calls[0]
    expect(managerArg).toBe(ambientManager)
    expect(rowsArg).toHaveLength(1)
    expect(rowsArg[0]).toMatchObject({ aggregateId: 'agg-cat2', dispatchedAt: null })
  })

  it('writes a category-1 audit row (dispatchedAt = now()) using the same ambient manager, and invokes the subscriber (triangulation)', async () => {
    const holder = new UnitOfWorkContextHolder()
    const ambientManager = {} as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    const subscriber = new FakeCategoryOneSubscriber()
    const onSpy = jest.spyOn(subscriber, 'on').mockResolvedValue(undefined)
    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    const router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )
    router.addSubscribers([subscriber])

    const before = Date.now()
    await holder.run(context, () => router.publish([new FakeEvent('agg-cat1-audit')]))

    expect(onSpy).toHaveBeenCalledTimes(1)
    expect(eventStoreService.appendInTransaction).toHaveBeenCalledTimes(1)
    const [managerArg, rowsArg] = eventStoreService.appendInTransaction.mock.calls[0]
    expect(managerArg).toBe(ambientManager)
    expect(rowsArg[0].dispatchedAt).toBeInstanceOf(Date)
    expect((rowsArg[0].dispatchedAt as Date).getTime()).toBeGreaterThanOrEqual(before)
  })

  it('does not attempt any additional recovery when a category-1 subscriber throws elsewhere in the same publish() call — just propagates', async () => {
    const holder = new UnitOfWorkContextHolder()
    const context: UnitOfWorkContext = { manager: {} as EntityManager, pending: [], depth: 0 }

    const failure = new Error('cat-1 boom')
    const catOneSubscriber = new FakeCategoryOneSubscriber()
    jest.spyOn(catOneSubscriber, 'on').mockRejectedValue(failure)

    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    const router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )
    router.addSubscribers([catOneSubscriber])

    await expect(holder.run(context, () => router.publish([new FakeEvent()]))).rejects.toBe(failure)
  })
})

describe('EventBusRouter — no-ambient-context outbox write opens its own short-lived transaction (path B, design D8)', () => {
  it('calls dataSource.transaction exactly once, scoped only to the outbox write, no category-1 dispatch', async () => {
    const holder = new UnitOfWorkContextHolder()
    const subscriber = new FakeCategoryTwoSubscriber()
    const onSpy = jest.spyOn(subscriber, 'on')

    let managerFromRouterTransaction: EntityManager | undefined
    const eventStoreService = buildEventStoreService()
    const dataSource = {
      transaction: jest.fn(async (work: (manager: EntityManager) => Promise<unknown>) => {
        managerFromRouterTransaction = { marker: 'router-own-tx' } as unknown as EntityManager
        return work(managerFromRouterTransaction)
      })
    }
    const router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )
    router.addSubscribers([subscriber])

    await router.publish([new FakeEvent('agg-path-b')])

    expect(dataSource.transaction).toHaveBeenCalledTimes(1)
    expect(onSpy).not.toHaveBeenCalled()
    expect(eventStoreService.appendInTransaction).toHaveBeenCalledTimes(1)
    const [managerArg, rowsArg] = eventStoreService.appendInTransaction.mock.calls[0]
    expect(managerArg).toBe(managerFromRouterTransaction)
    expect(rowsArg[0]).toMatchObject({ aggregateId: 'agg-path-b', dispatchedAt: null })
  })
})

describe('EventBusRouter — cascade queue (FIFO drain) + depth guard (design D1/D8)', () => {
  it('a nested publish() from within a category-1 subscriber enqueues (not dispatches inline) and drains before the top-level publish() resolves, in FIFO order, with ZERO dataSource.transaction calls', async () => {
    const holder = new UnitOfWorkContextHolder()
    const ambientManager = {} as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    const dispatchOrder: string[] = []

    class FirstEvent extends DomainEvent {
      static readonly EVENT_NAME = 'cascade.first'
      constructor() {
        super({ eventName: FirstEvent.EVENT_NAME, aggregateId: 'first', payload: {} })
      }
      toPrimitives(): Record<string, unknown> {
        return {}
      }
      static fromPrimitives(): DomainEvent {
        throw new Error('not needed')
      }
    }

    class SecondEvent extends DomainEvent {
      static readonly EVENT_NAME = 'cascade.second'
      constructor() {
        super({ eventName: SecondEvent.EVENT_NAME, aggregateId: 'second', payload: {} })
      }
      toPrimitives(): Record<string, unknown> {
        return {}
      }
      static fromPrimitives(): DomainEvent {
        throw new Error('not needed')
      }
    }

    // Forward reference: assigned once below, but declared mutable (let, not const) so the
    // subscriber classes' closures (defined before construction) can see it.
    // eslint-disable-next-line prefer-const
    let router!: EventBusRouter

    class FirstSubscriber implements DomainEventSubscriber<FirstEvent> {
      subscribedTo(): DomainEventClass[] {
        return [FirstEvent as unknown as DomainEventClass]
      }
      async on(): Promise<void> {
        dispatchOrder.push('first-start')
        await router.publish([new SecondEvent()])
        dispatchOrder.push('first-end')
      }
    }

    class SecondSubscriber implements DomainEventSubscriber<SecondEvent> {
      subscribedTo(): DomainEventClass[] {
        return [SecondEvent as unknown as DomainEventClass]
      }
      on(): Promise<void> {
        dispatchOrder.push('second')
        return Promise.resolve()
      }
    }

    DISPATCH_CATEGORIES.set(FirstSubscriber, DispatchCategory.Synchronous)
    DISPATCH_CATEGORIES.set(SecondSubscriber, DispatchCategory.Synchronous)

    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )
    router.addSubscribers([new FirstSubscriber(), new SecondSubscriber()])

    await holder.run(context, () => router.publish([new FirstEvent()]))

    // Nested publish() is not dispatched inline: it enqueues, drained AFTER
    // the first subscriber's handler frame — proves FIFO drain-at-top-frame,
    // not inline recursion.
    expect(dispatchOrder).toEqual(['first-start', 'first-end', 'second'])
    expect(dataSource.transaction).not.toHaveBeenCalled()
  })

  it('throws EventCascadeDepthExceeded at generation 11 (depth > MAX_CASCADE_DEPTH = 10, not off-by-one)', async () => {
    const holder = new UnitOfWorkContextHolder()
    const ambientManager = {} as EntityManager
    const context: UnitOfWorkContext = { manager: ambientManager, pending: [], depth: 0 }

    // Forward reference: assigned once below, but declared mutable (let, not const) so the
    // subscriber classes' closures (defined before construction) can see it.
    // eslint-disable-next-line prefer-const
    let router!: EventBusRouter
    let invocationCount = 0

    class CyclicEvent extends DomainEvent {
      static readonly EVENT_NAME = 'cascade.cyclic'
      constructor() {
        super({ eventName: CyclicEvent.EVENT_NAME, aggregateId: 'cyclic', payload: {} })
      }
      toPrimitives(): Record<string, unknown> {
        return {}
      }
      static fromPrimitives(): DomainEvent {
        throw new Error('not needed')
      }
    }

    class CyclicSubscriber implements DomainEventSubscriber<CyclicEvent> {
      subscribedTo(): DomainEventClass[] {
        return [CyclicEvent as unknown as DomainEventClass]
      }
      async on(): Promise<void> {
        invocationCount += 1
        await router.publish([new CyclicEvent()])
      }
    }

    DISPATCH_CATEGORIES.set(CyclicSubscriber, DispatchCategory.Synchronous)

    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )
    router.addSubscribers([new CyclicSubscriber()])

    await expect(
      holder.run(context, () => router.publish([new CyclicEvent()]))
    ).rejects.toBeInstanceOf(EventCascadeDepthExceeded)
    // 1 top-level dispatch + 10 cascaded re-dispatches = 11 invocations before the 11th generation's drain throws
    expect(invocationCount).toBe(11)
  })
})

describe('EventBusRouter — deferredSubscribersFor (Slice 9, OutboxPollerService discovery)', () => {
  it('returns only the category-2 subscribers registered for a given event name', () => {
    const holder = new UnitOfWorkContextHolder()
    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    const router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )

    const catOneSubscriber = new FakeCategoryOneSubscriber()
    const catTwoSubscriber = new FakeCategoryTwoSubscriber()
    router.addSubscribers([catOneSubscriber, catTwoSubscriber])

    const deferred = router.deferredSubscribersFor(FakeEvent.EVENT_NAME)

    expect(deferred).toEqual([catTwoSubscriber])
  })

  it('returns an empty array for an event name with no registered subscribers', () => {
    const holder = new UnitOfWorkContextHolder()
    const eventStoreService = buildEventStoreService()
    const dataSource = buildDataSource()
    const router = new EventBusRouter(
      holder,
      dataSource as unknown as DataSource,
      eventStoreService as unknown as EventStoreService
    )

    expect(router.deferredSubscribersFor('unknown.event')).toEqual([])
  })
})

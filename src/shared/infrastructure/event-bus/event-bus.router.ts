import { Injectable } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource, EntityManager } from 'typeorm'

import { DomainEvent, DomainEventSubscriber, EventBus } from '@shared/domain/events'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'
import {
  EventStoreService,
  OutboxRow
} from '@shared/infrastructure/event-sourcing/event-store.service'
import { MissingUnitOfWorkContext } from '@shared/domain/exceptions/missing-unit-of-work-context.exception'
import {
  EventCascadeDepthExceeded,
  MAX_CASCADE_DEPTH
} from '@shared/domain/exceptions/event-cascade-depth-exceeded.exception'
import {
  DISPATCH_CATEGORIES,
  DEFAULT_CATEGORY,
  DispatchCategory,
  SubscriberClass
} from './dispatch-category.registry'

type Subscribers = Array<DomainEventSubscriber<DomainEvent>>

/**
 * EventBusRouter
 *
 * Replaces InMemoryNestEventBus. Implements the design's D8 dual-path
 * publish(): reuse the ambient UnitOfWorkContext when one exists (path A —
 * joins the running transaction; this is also how recursive/cascading
 * publish and category-1 sync dispatch work), or open its own short-lived
 * transaction scoped only to the event_store write when no ambient context
 * exists (path B). A category-1 subscriber reached with no ambient context
 * is a hard failure (MissingUnitOfWorkContext), never silent
 * fire-and-forget degradation (design D5).
 *
 * Built incrementally across tasks 3.6-3.10: skeleton + path A category-1
 * sync dispatch (3.6), the MissingUnitOfWorkContext guard for no-context
 * category-1 dispatch (3.7), path A's outbox write joining the ambient
 * transaction (3.8), path B's own short-lived outbox-only transaction
 * (3.9), and the cascade queue/depth guard for recursive publish (3.10).
 */
@Injectable()
export class EventBusRouter implements EventBus {
  private readonly subscribersByEventName = new Map<string, Subscribers>()

  /**
   * Tracks which UnitOfWorkContext objects currently have a drain loop
   * running at their top frame. A nested publish() call (same context
   * instance, found via ALS) checks this set: if a drain is already in
   * progress, it enqueues into context.pending and returns immediately
   * instead of starting a second, competing drain loop.
   */
  private readonly contextsCurrentlyDraining = new WeakSet<UnitOfWorkContext>()

  constructor(
    private readonly uow: UnitOfWorkContextHolder,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly eventStoreService: EventStoreService
  ) {}

  async publish(events: DomainEvent[]): Promise<void> {
    const context = this.uow.current()

    if (context) {
      return this.publishWithin(context, events)
    }

    this.assertNoCategoryOneSubscribers(events)

    await this.dataSource.transaction(manager => this.writeOutboxOnly(manager, events))
  }

  /**
   * Path A (design D8) — dispatch within the ambient UnitOfWorkContext.
   *
   * If a drain is already running for this exact context (nested/recursive
   * publish from inside a category-1 subscriber's on()), the new events are
   * appended to context.pending and this call returns immediately — no
   * inline dispatch, no second transaction. The top-level call owns the
   * FIFO drain loop and processes generations until the queue is empty or
   * MAX_CASCADE_DEPTH is exceeded (design D1).
   */
  private async publishWithin(context: UnitOfWorkContext, events: DomainEvent[]): Promise<void> {
    if (this.contextsCurrentlyDraining.has(context)) {
      context.pending.push(...events)
      return
    }

    this.contextsCurrentlyDraining.add(context)
    try {
      await this.dispatchGeneration(context, events)
      await this.drainPendingGenerations(context)
    } finally {
      this.contextsCurrentlyDraining.delete(context)
    }
  }

  /**
   * Drains context.pending in FIFO generations. Each generation is the full
   * set of events enqueued by the PREVIOUS generation's subscribers — a
   * breadth-first drain, not depth-first inline recursion (design D1).
   * Each generation increments context.depth; exceeding MAX_CASCADE_DEPTH
   * throws EventCascadeDepthExceeded, rolling back the ambient transaction.
   */
  private async drainPendingGenerations(context: UnitOfWorkContext): Promise<void> {
    while (context.pending.length > 0) {
      context.depth += 1
      if (context.depth > MAX_CASCADE_DEPTH) {
        throw new EventCascadeDepthExceeded(MAX_CASCADE_DEPTH)
      }

      const generation = context.pending.splice(0, context.pending.length)
      await this.dispatchGeneration(context, generation)
    }
  }

  private async dispatchGeneration(
    context: UnitOfWorkContext,
    events: DomainEvent[]
  ): Promise<void> {
    for (const event of events) {
      const wasSynchronouslyDispatched = await this.dispatchCategoryOneSubscribers(event, context)
      await this.eventStoreService.appendInTransaction(context.manager, [
        this.toOutboxRow(event, wasSynchronouslyDispatched)
      ])
    }
  }

  /**
   * Path B (design D8): no ambient context — writes ONLY the event_store
   * rows in the router's own short-lived transaction. Category-1
   * subscribers are never reached here: assertNoCategoryOneSubscribers()
   * already guarded that above, before this transaction was opened.
   */
  private async writeOutboxOnly(manager: EntityManager, events: DomainEvent[]): Promise<void> {
    const rows = events.map(event => this.toOutboxRow(event, false))
    await this.eventStoreService.appendInTransaction(manager, rows)
  }

  /**
   * Design D5/D8: with no ambient context, a category-1 subscriber has no
   * transaction to run inside — fail loudly BEFORE any path-B outbox write
   * is attempted for that event, rather than silently degrading.
   */
  private assertNoCategoryOneSubscribers(events: DomainEvent[]): void {
    for (const event of events) {
      const categoryOneSubscribers = this.categoryOneSubscribersFor(event)
      if (categoryOneSubscribers.length > 0) {
        throw new MissingUnitOfWorkContext(
          categoryOneSubscribers[0].constructor.name,
          event.eventName
        )
      }
    }
  }

  addSubscribers(subscribers: Subscribers): void {
    subscribers.forEach(subscriber => {
      subscriber.subscribedTo().forEach(eventClass => {
        const existing = this.subscribersByEventName.get(eventClass.EVENT_NAME) ?? []
        this.subscribersByEventName.set(eventClass.EVENT_NAME, [...existing, subscriber])
      })
    })
  }

  /**
   * Category-2 subscribers registered for a given event name (Slice 9 —
   * OutboxPollerService). Reuses the SAME subscribersByEventName map the
   * router already builds via addSubscribers(), so the poller never needs a
   * second, parallel subscriber registry — a subscriber registered once
   * (via its owning feature module's OnModuleInit) is discoverable both for
   * synchronous path-A dispatch AND for deferred outbox dispatch.
   */
  deferredSubscribersFor(eventName: string): Subscribers {
    const subscribers = this.subscribersByEventName.get(eventName) ?? []
    return subscribers.filter(
      subscriber => this.categoryOf(subscriber) === DispatchCategory.Deferred
    )
  }

  private categoryOneSubscribersFor(event: DomainEvent): Subscribers {
    const subscribers = this.subscribersByEventName.get(event.eventName) ?? []
    return subscribers.filter(
      subscriber => this.categoryOf(subscriber) === DispatchCategory.Synchronous
    )
  }

  private categoryOf(subscriber: DomainEventSubscriber<DomainEvent>): DispatchCategory {
    return DISPATCH_CATEGORIES.get(subscriber.constructor as SubscriberClass) ?? DEFAULT_CATEGORY
  }

  /**
   * Returns true when at least one category-1 subscriber ran synchronously
   * for this event — the caller uses this to decide the outbox row's
   * dispatchedAt: `now()` for an audit row (already handled, D7), `null`
   * for a category-2 row still pending the poller.
   *
   * Dispatches with the SAME ambient context instance (not a fresh one) —
   * this is what lets a nested eventBus.publish() call inside on() find the
   * context already draining (via contextsCurrentlyDraining) and enqueue
   * into context.pending instead of opening a second, competing drain.
   */
  private async dispatchCategoryOneSubscribers(
    event: DomainEvent,
    context: UnitOfWorkContext
  ): Promise<boolean> {
    const categoryOneSubscribers = this.categoryOneSubscribersFor(event)

    for (const subscriber of categoryOneSubscribers) {
      await this.uow.run(context, () => subscriber.on(event))
    }

    return categoryOneSubscribers.length > 0
  }

  private toOutboxRow(event: DomainEvent, wasSynchronouslyDispatched: boolean): OutboxRow {
    return {
      aggregateId: event.aggregateId,
      aggregateType: this.extractAggregateType(event.eventName),
      eventType: event.eventName,
      version: event.version,
      payload: event.toPrimitives(),
      metadata: event.metadata ?? null,
      correlationId: event.metadata?.correlationId ?? null,
      occurredAt: event.occurredOn,
      dispatchedAt: wasSynchronouslyDispatched ? new Date() : null
    }
  }

  private extractAggregateType(eventName: string): string {
    return eventName.split('.')[0] || 'unknown'
  }
}

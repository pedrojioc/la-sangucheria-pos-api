import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { Interval } from '@nestjs/schedule'
import { DataSource, EntityManager } from 'typeorm'

import { EventStoreService } from './event-store.service'
import { EventStoreEntity } from './persistence/event-store.entity'
import { EventRegistry } from './event-registry'
import { EventBusRouter } from '@shared/infrastructure/event-bus/event-bus.router'

const CLAIM_BATCH_SIZE = 50
const POLL_INTERVAL_MS = 5000

/**
 * OutboxPollerService (design D3)
 *
 * Dispatches category-2 ("Deferred") events written to the event_store
 * outbox by EventBusRouter (D8). Runs on a fixed 5s interval via
 * @nestjs/schedule, one own transaction per tick:
 *
 *   1. Claim up to 50 undispatched rows (dispatchedAt IS NULL) with
 *      `FOR UPDATE SKIP LOCKED` — implemented by
 *      EventStoreService.claimUndispatched (Slice 3), reused here rather
 *      than re-implemented, so multiple poller instances never double-claim
 *      the same row.
 *   2. Rehydrate each row into a real DomainEvent via EventRegistry.
 *   3. Look up the category-2 subscribers registered for that event name on
 *      EventBusRouter (the SAME registry category-1 dispatch uses — see
 *      EventBusRouter.deferredSubscribersFor) and invoke each, awaited.
 *   4. Mark only the rows that dispatched successfully — per-event
 *      try/catch, no dead-letter queue / attempt counter (design D3:
 *      explicitly rejected as over-engineering at this scale). A row whose
 *      subscriber throws simply stays dispatchedAt = NULL and is retried
 *      naturally on the next tick; the failure is logged with eventId and
 *      eventType so it's observable without a dedicated failure table.
 *
 * Category-1 rows are NEVER claimed here: they are written with
 * dispatchedAt = now() at publish time (D7/D8), so the partial index this
 * query relies on (`WHERE dispatched_at IS NULL`) already excludes them —
 * this is a schema-level guarantee, not something the poller checks.
 */
@Injectable()
export class OutboxPollerService {
  private readonly logger = new Logger(OutboxPollerService.name)

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly eventStoreService: EventStoreService,
    private readonly eventBusRouter: EventBusRouter,
    private readonly eventRegistry: EventRegistry
  ) {}

  @Interval(POLL_INTERVAL_MS)
  async poll(): Promise<void> {
    await this.pollOnce()
  }

  /**
   * Extracted from poll() so unit tests can invoke a single tick directly,
   * without waiting on or mocking @nestjs/schedule's interval machinery.
   */
  async pollOnce(): Promise<void> {
    await this.dataSource.transaction(manager => this.claimAndDispatch(manager))
  }

  private async claimAndDispatch(manager: EntityManager): Promise<void> {
    const rows = await this.eventStoreService.claimUndispatched(manager, CLAIM_BATCH_SIZE)

    if (rows.length === 0) {
      return
    }

    const dispatchedIds: string[] = []

    for (const row of rows) {
      const dispatched = await this.dispatchRow(row)
      if (dispatched) {
        dispatchedIds.push(row.id)
      }
    }

    if (dispatchedIds.length > 0) {
      await this.eventStoreService.markDispatched(manager, dispatchedIds)
    }
  }

  /**
   * Dispatches a single claimed row to its category-2 subscriber(s).
   * Returns true only if every subscriber for this row succeeded — a single
   * subscriber throwing leaves the WHOLE row undispatched (never partially
   * marked), so a retry re-attempts every subscriber, not just the failed
   * one. Logs and swallows the failure so one bad row never stops the rest
   * of the batch from being processed.
   *
   * Subscribers are looked up BEFORE rehydration: an event with zero
   * category-2 subscribers today (e.g. UserLoggedInEvent, which has no
   * subscriber of any category) has nothing to rehydrate for — treating it
   * as dispatched avoids both an EventRegistry lookup failure and an
   * infinite retry loop for events that were never meant to reach this
   * poller in the first place (they land in event_store because the router
   * persists every published event for audit purposes, not because they
   * need deferred dispatch).
   */
  private async dispatchRow(row: EventStoreEntity): Promise<boolean> {
    const subscribers = this.eventBusRouter.deferredSubscribersFor(row.eventType)

    if (subscribers.length === 0) {
      return true
    }

    try {
      const event = this.eventRegistry.rehydrate(row.eventType, {
        aggregateId: row.aggregateId,
        eventId: row.id,
        occurredOn: row.occurredAt,
        payload: row.payload,
        metadata: row.metadata ?? {},
        version: row.version
      })

      for (const subscriber of subscribers) {
        await subscriber.on(event)
      }

      return true
    } catch (error) {
      this.logger.error(
        `Failed to dispatch outbox event ${row.id} (${row.eventType}): ${
          error instanceof Error ? error.message : String(error)
        }`
      )
      return false
    }
  }
}

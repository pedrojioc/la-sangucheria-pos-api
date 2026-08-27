# Context: Unit of Work + Event Dispatch Split (sync in-transaction vs. outbox)

## Situation

This is a **development-environment** change. No production data to protect. Design for the correct end-state; no backward-compatibility shims needed.

**Depends on / related to a parallel change**: another session is currently migrating `orders.items` from jsonb to a real `order_items` table, and as part of that work has already decided to **remove `kitchen_board_items` and its projection entirely** (`KitchenBoardProjector`, `TypeOrmKitchenBoardQueryService`, the entity/repository/migrations) — the kitchen board will query `orders ⋈ order_items` directly instead. Treat that as already decided; do not reintroduce or reference the projection as something to keep. If that migration hasn't landed yet when this change starts, check its current state before assuming the projection is gone.

## Why this change (root cause investigation, prior discussion)

### Incident 1 — kitchen board

Order `d4bb7789-f0e6-4556-a6dc-312a693b2a11` reached `IN_PROGRESS` in `orders` but never appeared on the kitchen board — its `OrderSentToKitchenEvent` was lost. `event_store` had 0 rows across the whole environment, meaning `PersistDomainEventsSubscriber` (which listens via `@OnEvent('**')` on `EventEmitter2`) never durably persisted it either.

### Incident 2 — inventory deduction and purchase orders (already lived by the user, predates this investigation)

Inventory deduction on sale was previously implemented as a domain event subscriber. It was **abandoned** after the same class of bug: events got lost in the async bus, stock ended up desynced from actual sales. The same happened with purchase orders — a failure partway through could leave the database inconsistent, with no rollback. The user's reaction at the time was to move away from event-driven dispatch for these cases back to more direct/coupled calls, because the only dispatch mechanism available (`InMemoryNestEventBus`) was wrong for this category of reaction — not because domain events as a pattern were the problem.

### Root cause common to both incidents

`InMemoryNestEventBus` (`src/shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts`) publishes via `EventEmitter2.emit()` wrapped in `setImmediate()` — fire-and-forget, no delivery guarantee, no persistence, no retry, and **decoupled from the transaction that saved the aggregate**. If the process restarts or a listener isn't registered yet in that window, the event is gone forever. There is also no Unit of Work: multiple `repository.save()` calls in one request each run in their own implicit TypeORM transaction, so a failure partway through a multi-aggregate write leaves inconsistent data with no rollback — confirmed by the user as the current state (only a few call sites, like `nextOrderNumber` in `typeorm-order.repository.ts`, use `dataSource.transaction()` manually).

## The core insight this change is built on

**Domain events as a design pattern (DDD, Vaughn Vernon) are correct and must be kept** — `Order.close()` should not import `Table`, `Invoice`, or `Inventory` modules directly; that's exactly the coupling/circular-reference problem domain events solve. The mistake was routing every reaction through a single async, guarantee-free dispatch mechanism regardless of whether that reaction could tolerate eventual consistency.

**Domain event subscribers must be classified into two categories, each with its own dispatch mechanism:**

| Category | Definition | Examples in this codebase | Dispatch mechanism |
|---|---|---|---|
| **1 — Must be atomic with the trigger** | If this silently fails, the system is in a wrong state nobody notices immediately | `OnOrderClosedReleaseTable` (table stays phantom-occupied), inventory deduction on sale (to be reintroduced — currently NOT implemented as a subscriber, was reverted to direct calls after the incident above) | **Synchronous, in-process, inside the same Unit-of-Work transaction** as the aggregate save. If the subscriber throws, the whole transaction rolls back. |
| **2 — Can tolerate delay/retry** | External, slow, not always applicable, failure doesn't corrupt core state | `OnOrderClosedIssueBillingDocument` (calls an external e-invoicing API — **not yet implemented**, only fires for customers who require electronic billing, not every order), `OnOrderSentPrintKitchenTicket` (physical printer, can be offline) | **Outbox pattern**: event persisted to `event_store` (already exists, see below) in the same transaction, then a separate polling publisher dispatches asynchronously with retries. |

Subscribers not yet classified during the debate (`OnOrderClosedUpdateLifetimeValue`, loyalty-related reactions) — likely category 2 (not blocking for the sale), but confirm during explore/design rather than assuming.

## What already exists and should be reused, not rebuilt

- **`event_store` table + `EventStoreService`** (`src/shared/infrastructure/event-sourcing/`): already has `aggregateId + version` unique constraint (optimistic locking), `getEventStream()`, `getAggregateVersion()`, query methods by type/correlationId/date range. This is legitimate outbox-table infrastructure — it's just never written to inside the same transaction as the aggregate, and nothing currently reads "undispatched" events from it to relay them. Reuse this table; don't create a second one.
- **`PersistDomainEventsSubscriber`** (`@OnEvent('**')` wildcard listener): currently the (broken) attempt to persist every event. This responsibility moves into the outbox-write step (inside the UoW transaction), not as a fire-and-forget listener.

## Design decisions already made in discussion (treat as settled, not open questions)

### 1. Unit of Work via AsyncLocalStorage — does NOT touch use cases

Reference pattern: https://github.com/LuanMaik/nestjs-typeorm-transaction-unitOfWork-AsyncLocalStorage

- A transaction is opened OUTSIDE the use case — e.g. a NestJS interceptor (`@UseInterceptors(TransactionInterceptor)`) applied at the controller/route level, or an explicit wrapper call from the controller. This is presentation-layer infrastructure; decorators are fine there.
- The interceptor stores the transactional `EntityManager` in an `AsyncLocalStorage` context for the duration of the request.
- Repository implementations (`TypeOrmOrderRepository`, etc. — infrastructure layer) check the `AsyncLocalStorage` first: if a transactional manager is active, use it; otherwise fall back to the default injected manager.
- **Use cases do not change at all.** `CloseOrder.run()` keeps calling `this.repository.save(order)` exactly as today — pure class, no decorators, no knowledge of transactions. This preserves `createProvider`-based registration and the "use cases are pure classes" rule (CLAUDE.md).
- Multiple `repository.save()` calls across different aggregates within one request-scoped transaction now commit or roll back together.

### 2. EventBus becomes the sync/outbox router — also does NOT touch use cases

- Use cases keep calling `this.eventBus.publish(events)` exactly as today — same call, same signature.
- The `EventBus` implementation (infrastructure layer, not domain/application) is responsible for routing: for each event, look up whether its subscribers are category 1 or category 2.
  - Category 1 subscribers: invoked synchronously, right there, using the same active transactional `EntityManager` from `AsyncLocalStorage` (so a category-1 subscriber failure rolls back the whole transaction — including the original aggregate save).
  - Category 2 subscribers: the event is written into `event_store` (outbox) within the same transaction; a separate polling publisher process picks up undispatched rows afterward and delivers them with retries.
- The categorization (which event/subscriber is sync vs. outbox) is infrastructure-level configuration, not something the domain or application layer encodes.

### 3. Outbox relay mechanism: polling publisher, NOT CDC/Debezium

For this project's scale (single-location POS, single Postgres instance, not a distributed microservices fleet), a **polling publisher** (a process that periodically queries `event_store` for undispatched rows, e.g. via `SELECT ... FOR UPDATE SKIP LOCKED`) is the right level of complexity. Introducing Debezium + Kafka for CDC-based transaction log tailing would be over-engineering at this scale — that approach is what companies like Netflix/Uber use at a very different scale and with actual multi-service message brokers already in place. Do not introduce Debezium/Kafka.

## Blast radius / files likely involved

- `src/shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts` — becomes the sync/outbox router (or is replaced by a new implementation of the `EventBus` abstract class)
- `src/shared/domain/events/event-bus.ts` — abstract class, check if signature needs to change (likely not — `publish(events)` stays the same)
- `src/shared/infrastructure/event-sourcing/event-store.service.ts` + `event-store.entity.ts` — reused as the outbox table; may need a `dispatchedAt`/`status` column to track undispatched rows for the poller
- `src/shared/infrastructure/event-sourcing/subscribers/persist-domain-events.subscriber.ts` — likely removed/replaced (its job moves into the EventBus router's outbox-write step)
- New: a Unit-of-Work service/interceptor + `AsyncLocalStorage`-aware base for TypeORM repositories
- New: a polling publisher process/service for category-2 event dispatch
- Every `TypeOrmXxxRepository` that currently injects `Repository<XxxEntity>` directly — needs to become AsyncLocalStorage-aware (or share a common base class that handles this once)
- `src/contexts/orders/order/application/subscribers/on-order-closed-release-table.ts` — reclassify as category 1
- Inventory deduction on sale — needs to be **reintroduced** as a category-1 subscriber (it doesn't exist today; it was reverted after the earlier incident)
- `src/contexts/billing/invoice/application/subscribers/on-order-closed-issue-billing-document.ts` — reclassify as category 2 (confirmed: calls an external e-invoicing API, not yet implemented, only fires for customers requiring electronic billing — not every order)
- `src/contexts/kitchen-operations/kitchen-printer/application/subscribers/on-order-sent-print-kitchen-ticket.ts` — category 2 (physical printer can be offline)
- Loyalty / lifetime-value subscribers — confirm category during explore, likely category 2

## Explicitly out of scope

- The `kitchen_board_items` projection is being removed in a parallel change (see Situation above) — do not design category-1 dispatch around "keep the projection in sync," that consumer is going away.
- Deciding the concrete e-invoicing API integration (which provider, request/response shape) — out of scope here; only the dispatch mechanism (outbox category) for triggering it is in scope.

## Requested process

Run through SDD (`/sdd-new` or equivalent): explore → propose → spec → design → tasks → apply → verify. The design phase should produce the concrete AsyncLocalStorage-based UoW mechanism, the EventBus sync/outbox router shape, the `event_store` schema changes needed for the poller (undispatched-row tracking), and the polling publisher implementation — all treating the category classification and architectural boundaries above as settled decisions, not open questions.

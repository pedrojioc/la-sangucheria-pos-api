# Context: Extract the Outbox Poller into its Own Worker Process

## Situation

This is a **development-environment** change. No production data to protect. Design for the correct end-state; no backward-compatibility shims needed.

**Depends on / builds on top of**: the `event-bus-uow-outbox` change (already implemented, merged to `main` as of this writing, ~19 commits). That change introduced:
- An AsyncLocalStorage-based Unit of Work (`UnitOfWorkContextHolder`, `TransactionInterceptor`, opt-in per controller method via `@UseInterceptors(TransactionInterceptor)`).
- `EventBusRouter` (`src/shared/infrastructure/event-bus/event-bus.router.ts`) — dispatches category-1 (must-be-atomic) subscribers synchronously inside the ambient transaction, and category-2 (can-tolerate-delay) subscribers via a persisted outbox (`event_store` table, reused, with a `dispatched_at` nullable column + partial index).
- `OutboxPollerService` (`src/shared/infrastructure/event-sourcing/outbox-poller.service.ts`) — runs `@Interval(5000)` from `@nestjs/schedule`, inside the **same NestJS process that serves HTTP traffic**. Each tick: claims up to 50 undispatched rows via `SELECT ... FOR UPDATE SKIP LOCKED`, rehydrates each into a real `DomainEvent` via `EventRegistry`, invokes every category-2 subscriber registered for that event name (looked up on `EventBusRouter.deferredSubscribersFor()`, the same subscriber registry category-1 dispatch uses), marks successfully-dispatched rows, leaves failed ones with `dispatched_at = NULL` for a naturally-retried next tick (no dead-letter queue, no attempt counter — deliberately rejected as over-engineering at this project's scale, see design D3 of the previous change).

Read `docs/architecture/event-bus-uow-outbox-context.md` first if it still exists in the repo — this change assumes everything in it is already built and working, does not re-litigate any of it, and only touches how/where `OutboxPollerService` runs.

## Why this change

Found during manual e2e verification of the previous change, discussed directly with the user:

1. **Process coupling**: `OutboxPollerService` runs inside the same Node process as the HTTP API server (`AppModule` in `src/app.module.ts`, bootstrapped from `src/main.ts`). There is no way to run one without the other today.
2. **Dev noise**: because the poller ticks every 5s regardless of whether there's anything to dispatch, its `SELECT ... FOR UPDATE SKIP LOCKED` + `COMMIT` (and occasionally `UPDATE`) queries show up constantly in the query logger while the developer is manually testing unrelated endpoints — makes it harder to read logs for the thing actually being tested.
3. **Scaling/ops concern (secondary, not blocking)**: if the API server is ever scaled to multiple instances, every instance runs its own poller today. The `FOR UPDATE SKIP LOCKED` locking already makes this *safe* (no double-dispatch — confirmed and explained to the user this session), but it's still wasteful: N processes polling the same table when one dedicated worker would do.

## Alternatives considered and explicitly rejected

The user's frame of reference was Sidekiq (Rails, Redis-backed job queue) from a project they built themselves. Discussed directly:

- **Redis-backed broker (BullMQ or similar, Sidekiq's closer analogue)**: rejected for this round. It solves the same problem but adds a new infrastructure dependency (Redis) and a materially different queue model (native retries/backoff/DLQ) that this project has not asked for and does not currently need. This project's scale (single-location POS, single Postgres instance) does not justify it yet. **Not ruled out forever** — if the DB-polling approach turns out to be insufficient later, revisit this as a separate change, not folded into this one.
- **Environment-flag opt-out inside the same process** (`ENABLE_OUTBOX_POLLER=false` gating whether `OutboxPollerService` registers): rejected as not solving the actual problem — it's still the same process, same entry point, doesn't give real process-level separation, only a dev-time mute button.

## Design decision already made (treat as settled, not an open question)

**Second NestJS entry point, own process, same Postgres — no new infrastructure dependency.**

- Add a second bootstrap file (e.g. `src/worker.ts`) with its own minimal `AppModule`-equivalent — no HTTP controllers, no `main.ts`'s Nest HTTP adapter — that wires only what `OutboxPollerService` needs: `TypeOrmModule` (same `DataSource`/connection config as the API), `EventStoreModule`, `EventBusRouter` + subscriber registration (the deferred/category-2 subscribers need to be registered on `EventBusRouter` in the worker process too, since `deferredSubscribersFor()` reads from the same in-memory `subscribersByEventName` map the router builds via `addSubscribers()` — the worker process needs its OWN instance of that map, populated the same way `OnModuleInit` does it today per feature module).
- The worker process connects to the **same Postgres database** as the API — this is exactly what makes `FOR UPDATE SKIP LOCKED` continue to work correctly as the safety mechanism; nothing changes about the locking/claiming logic itself, only which process runs it.
- New `package.json` script (e.g. `start:worker`, `start:worker:dev`) to run it independently of `start:dev`. In dev, the developer can now run the API without the worker ticking in the background — solves the "noise while testing" complaint directly.
- The existing `OutboxPollerService`, `EventStoreService`, `EventBusRouter`, `EventRegistry`, `dispatch-category.registry.ts` code does **not** need to change — this is a wiring/bootstrap change, not a logic change. `FOR UPDATE SKIP LOCKED` was already designed (previous change) to be safe under multiple concurrent pollers, so nothing about the claim-and-dispatch mechanism is at risk here.

## Open questions for explore/design (not yet settled)

1. **Exact subscriber registration surface for the worker process** — does the worker need to import full feature modules (`OrderModule`, `CrmModule`, etc.) to get their `OnModuleInit` subscriber wiring, or is there a cleaner way to register only the category-2 subscribers without pulling in each feature module's full provider graph (use cases, controllers it doesn't need)? Needs investigation — may require extracting subscriber registration into something shared/reusable between `AppModule` and the new worker module, rather than duplicating it.
2. **Local dev ergonomics** — should `start:dev` (API) and a `start:worker:dev` run together via a single `pnpm` script (e.g. `concurrently`), or does the developer just run two terminals? Ask the user during explore/design rather than assuming.
3. **Deployment shape** — out of scope to fully design (no production infra decisions needed for a dev-only project right now), but the design doc should at least note that this becomes two deployable processes going forward (e.g. two Docker services / two Railway-style processes), not prescribe the actual deployment config.
4. **Does the worker process need any HTTP surface at all** (e.g. a `/health` endpoint for process monitoring)? Lean toward no for this iteration — confirm with the user rather than adding scope unasked.

## Explicitly out of scope

- Any broker/queue library (BullMQ, `pg-boss`, Redis) — this change is process separation only, not a dispatch-mechanism change. If the DB-polling approach proves insufficient later, that's a separate future change.
- Changing `OutboxPollerService`'s retry semantics (no DLQ, no backoff, no attempt counter) — unchanged from the previous change's D3 decision.
- Changing the poll interval, batch size, or claim query — unchanged (`POLL_INTERVAL_MS = 5000`, `CLAIM_BATCH_SIZE = 50` in `outbox-poller.service.ts`).
- Category-1 (synchronous) dispatch — entirely unaffected; it only ever runs inside the API process, inside the request's own transaction, and always will.

## Requested process

Run through SDD (`/sdd-new` or equivalent): explore → propose → spec → design → tasks → apply → verify. Explore should confirm the exact shape of `AppModule`/`main.ts` today (what's global vs. feature-scoped, how subscribers actually get registered per module) before design commits to the worker's module composition. Treat the "second entry point, same Postgres, no new dependency" decision above as settled; resolve the four open questions above during explore/design, not by silent assumption.

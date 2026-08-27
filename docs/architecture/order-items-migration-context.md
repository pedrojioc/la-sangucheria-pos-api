# Context: Migrate `orders.items` (jsonb) → `order_items` (table)

## Situation

This is a **development-environment-only** migration. There is no production data to protect — existing rows in `orders` and `kitchen_board_items` can be dropped/truncated freely. Do not design for zero-downtime or backward-compatible data migration; design for the correct end-state schema.

## Why this migration (decision context from a prior discussion, not yet formalized as an SDD proposal)

`orders.items` is currently a `jsonb` column (`OrderItemPrimitives[]`) on `OrderEntity`. This was default behavior, not a deliberate decision — nobody evaluated it against the use case.

Evidence that jsonb is the wrong shape for `items`:

1. Individual order items have their **own independent lifecycle** (`PENDING → SENT → READY → DELIVERED` or `CANCELLED`), driven by separate domain events per item: `OrderItemReadyEvent`, `OrderItemDeliveredEvent`, `OrderItemCancelledEvent` (see `src/contexts/orders/order/domain/order.ts` — `markItemReady`, `markItemDelivered`, `cancelItem`). Each mutates ONE item inside the array, then the whole `Order` aggregate (and its full jsonb array) gets rewritten via `save()`.
2. Because SQL can't efficiently filter/index inside a jsonb array by fields like `stationId`/`status` per item, a separate **read-model projection** (`kitchen_board_items` table) was built just to serve the kitchen Kanban board (`GET /kitchen-operations/board`, `SSE /kitchen-operations/board/stream`). That projection is populated asynchronously by `KitchenBoardProjector`, a domain event subscriber.
3. The event bus that feeds the projector (`InMemoryNestEventBus`) has **no delivery guarantees** (in-memory pub/sub via `EventEmitter2` + `setImmediate()`, no outbox, no persistence, no retry). This already caused a real bug: an order reached `IN_PROGRESS` in `orders` but never got a row in `kitchen_board_items` because its `OrderSentToKitchenEvent` was lost (likely a race with server restart/module init). `event_store` table is empty across the whole environment, confirming `PersistDomainEventsSubscriber` isn't durably persisting events either.
4. There's already a precedent in the codebase for querying items directly out of the jsonb column without the projection: `TypeOrmOrderRepository.searchWithActiveKitchenItems()` (`src/contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository.ts:61-77`) uses `jsonb_array_elements(o.items)` + `EXISTS` to find orders with active kitchen items — proving direct-from-source queries are already done today, just clumsily (jsonb scan instead of indexed columns).

**Root cause chain being addressed**: jsonb column (can't index/update per-item) → forced a separate projection to make per-item queries fast → projection needs a reliable event bus to stay in sync → event bus is unreliable → data loss bug. Moving to a real `order_items` table removes the first link, which may remove the need for the second and third.

## Two things to evaluate/do, in order

### 1. Migrate `orders.items` (jsonb) to a proper `order_items` table

Model exactly what's in `OrderItemPrimitives` (`src/contexts/orders/order/domain/order-item.ts:8-26`):

```typescript
export interface OrderItemPrimitives {
  id: string
  productId: string
  productName: string
  unitPrice: number
  currency: string
  quantity: number
  modifiers: OrderItemModifierPrimitives[]
  notes: string | null
  discount: DiscountPrimitives | null
  status: OrderItemStatus
  sentAt: Date | null
  readyAt: Date | null
  deliveredAt: Date | null
  deliveredBy: string | null
  cancelledAt: Date | null
  cancelledBy: string | null
  cancellationReason: string | null
}
```

Needs an `order_id` FK back to `orders`. `modifiers` and `discount` can likely stay as jsonb sub-columns (they're small, nested, always read/written whole — no evidence they need their own tables; don't over-normalize without checking usage first).

**Open design question to resolve during SDD explore/design, not assumed here**: `stationId` is NOT currently part of `OrderItemPrimitives` or the `Order` aggregate — it's resolved at runtime inside `Order.sendToKitchen()` via a `stationAssignments: Map<productId, stationId>` parameter (see `order.ts:227-287`) and only ever travels inside the `OrderSentToKitchenEvent` payload (`SentToKitchenItem.stationId`). It is never persisted on the item itself today. Decide deliberately whether `order_items` should gain a `station_id` column (changing the aggregate/domain model) or whether station resolution stays entirely out-of-band. This has direct consequences for point 2 below — the Kanban board needs to filter by `stationId`.

**Blast radius** — files that currently read/write `order.items` or `OrderItemPrimitives` and will need changes:
- `src/contexts/orders/order/domain/order.ts` (aggregate — `items: OrderItem[]`, all mutation methods)
- `src/contexts/orders/order/domain/order-item.ts` (entity + primitives)
- `src/contexts/orders/order/infrastructure/persistence/typeorm/order.entity.ts` (drop `items` jsonb column)
- `src/contexts/orders/order/infrastructure/persistence/typeorm/typeorm-order.repository.ts` (`save()`, `search()`, `searchWithActiveKitchenItems()`, `toDomain()` — all touch `p.items`/`entity.items`)
- `src/contexts/orders/order/application/dto/order.response.ts`
- `src/contexts/orders/order/application/dto/kitchen-queue.response.ts`
- `src/contexts/orders/order/application/send-to-kitchen/send-order-to-kitchen.ts`
- `src/contexts/orders/order/domain/events/order-sent-to-kitchen.event.ts`
- `src/contexts/orders/order/presentation/http/controllers/order.controller.ts`
- `src/contexts/kitchen-operations/kitchen-printer/application/kitchen-printer-dispatcher.ts`
- `src/contexts/kitchen-operations/kitchen-printer/infrastructure/adapters/esc-pos-kitchen-printer.adapter.ts`
- Everything under point 2 (kitchen-board module) if the projection is removed/replaced.

Since this is dev-only, migration should DROP the existing jsonb column and CREATE the new table — no data transformation/backfill needed. Use `pnpm migration:generate` after modifying the entity per project convention (CLAUDE.md), review the generated SQL since a jsonb→table split is a structural change TypeORM may not infer perfectly.

### 2. Evaluate whether `kitchen_board_items` (the CQRS projection) is still needed

Once `order_items` exists as a real indexed table (with `order_id`, `status`, and — if decided in point 1 — `station_id`), re-evaluate whether the kitchen Kanban board can be served with a direct query:

```
orders ⋈ order_items ⋈ tables
WHERE order_items.status IN ('SENT','READY') AND (order_items.station_id = X OR ...)
```

instead of maintaining `kitchen_board_items` as an async, eventually-consistent projection fed by an unreliable event bus.

Current projection consumers to check before deciding:
- `src/contexts/kitchen-operations/kitchen-board/application/subscribers/kitchen-board-projector.ts` — the event subscriber that writes the projection (reacts to `OrderOpenedEvent`, `OrderSentToKitchenEvent`, `OrderReadyEvent`, `OrderItemReadyEvent`, `OrderItemDeliveredEvent`, `OrderItemCancelledEvent`)
- `src/contexts/kitchen-operations/kitchen-board/infrastructure/query-services/typeorm-kitchen-board-query.service.ts` — reads the projection, groups by order, handles a "PLACEHOLDER" row pattern for orders opened but not yet sent to kitchen
- `src/contexts/kitchen-operations/kitchen-board/presentation/http/controllers/kitchen-board.controller.ts` — `GET board` (poll) + `SSE board/stream` (push via `KitchenBoardEventEmitter`)
- `src/contexts/kitchen-operations/kitchen-board/infrastructure/persistence/typeorm/kitchen-board-item.entity.ts` + its repository + migrations (3 migrations reference this table)

Note: the "PLACEHOLDER" row concept (one row with `itemId: null` representing an OPEN order with no items sent yet) exists **only because** the projection needed a way to represent "this order exists" before it has real item rows. If the board queries `orders` directly, the order row itself is the header — the placeholder concept likely disappears entirely, which simplifies `KitchenBoardProjector` and `TypeOrmKitchenBoardQueryService` significantly (or eliminates them).

**What still needs the SSE push mechanism regardless of the decision**: `KitchenBoardEventEmitter` / `RxjsKitchenBoardEventEmitter` (the real-time push to connected kitchen displays) is orthogonal to where the data comes from — that stays either way. What's in question is only whether there's a separate persisted+denormalized table behind it, or whether the query on push is directly against `orders`/`order_items`.

**Decision must be evidence-based, not assumed**: benchmark or reason through whether a direct join query (with proper indexes on `order_items(station_id, status)` and `orders(status)`) is fast enough to run on every SSE push, given expected order volume. If yes, drop `kitchen_board_items` entirely (repository, entity, projector, migrations — mark migrations as superseded/squashed since this is dev-only). If there's a remaining real reason to keep a projection (e.g., cross-aggregate data that's expensive to join every time), scope it down and re-justify explicitly — don't keep it "just in case."

## Explicitly out of scope for this change (separate future debate)

- The event bus reliability problem (`InMemoryNestEventBus` lacking outbox/retry) is a **separate, already-identified issue** to debate later. If the projection ends up staying (fully or partially) after evaluating point 2, do NOT attempt to fix event bus reliability as part of this change — that's intentionally deferred.

## Requested process

Run this through SDD (`/sdd-new` or equivalent) so it goes through explore → propose → spec → design → tasks → apply → verify. The explore/design phases should make the `stationId` placement decision and the "keep vs. drop projection" decision explicit and justified, not silently assumed.

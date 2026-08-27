# Kitchen Board — Real-Time Integration Contract

## Endpoint

```
GET /kitchen-operations/board/stream?stationId={stationId}
```

- Protocol: **Server-Sent Events** (`Content-Type: text/event-stream`). Real push — event-driven from domain events, NOT polling.
- `stationId` query param is **optional**.
  - Omitted → all stations, unfiltered.
  - A real station UUID → only items for that station (OPEN placeholder rows for orders always included regardless of filter).
  - `"UNASSIGNED"` → items with no station assigned.
- Initial snapshot: `GET /kitchen-operations/board?stationId={stationId}` (same query params, same response shape, plain JSON — use this to hydrate the board on load, then attach to `/stream` for updates).

Do **not** use `GET /orders/kitchen/stream` — that one is a 3-second server-side poll dressed as SSE, kept for backward compatibility only. It is not real-time and does not carry `orderStatus`.

### Auth — do NOT use the native `EventSource` API

The native browser `EventSource` client cannot send custom headers, which makes `Authorization: Bearer` impossible with it. We are **not** working around this with a `?token=` query param (that would leak live access tokens into nginx/proxy access logs, browser history, and any Referer-forwarding integration) — the required approach is `@microsoft/fetch-event-source`, which streams over a real `fetch()` call and supports normal headers:

```javascript
import { fetchEventSource } from '@microsoft/fetch-event-source'

fetchEventSource(`/kitchen-operations/board/stream?stationId=${stationId}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
  onmessage(ev) {
    const board = JSON.parse(ev.data)
    // update Kanban state
  },
  onerror(err) {
    // library retries automatically on transient errors; rethrow to stop retrying
  }
})
```

This endpoint's guard only accepts `Authorization: Bearer` — same as every other authenticated endpoint in the API, no special-casing on the backend for `/stream` routes.

## Message payload

Each SSE `data:` event is the **full current board state** (not a diff) — replace your client-side state with each message, don't merge.

```typescript
type KitchenBoardResponse = KitchenBoardOrderGroup[]

interface KitchenBoardOrderGroup {
  orderId: string
  orderNumber: string
  orderStatus: 'OPEN' | 'IN_PROGRESS' | 'READY'
  tableId: string | null
  tableLabel: string | null
  oldestSentAt: string   // ISO date
  items: KitchenBoardItemResponse[]
}

interface KitchenBoardItemResponse {
  id: string
  itemId: string
  itemName: string
  stationId: string | null
  status: 'SENT' | 'READY' | 'DELIVERED' | 'CANCELLED'
  quantity: number
  notes: string | null
  modifiers: Record<string, any>[]
  sentAt: string          // ISO date
  readyAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
}
```

## Kanban column mapping

Map `orderStatus` directly to your 3 columns:

| `orderStatus`  | Column        | Trigger |
|----------------|---------------|---------|
| `OPEN`         | Open          | Order created, before being sent to kitchen |
| `IN_PROGRESS`  | In Progress   | Order sent to kitchen (at least one item `SENT`) |
| `READY`        | Ready         | Every active item on the order reached `DELIVERED` |

`CLOSED` and `CANCELLED` orders never appear on this board — they leave the kitchen flow entirely and are out of scope for this stream.

## Important: `OPEN` orders can have `items: []`

An order that just opened (before send-to-kitchen) shows up on the board as a group with `orderStatus: 'OPEN'` and an **empty `items` array**. This is intentional — it's a placeholder so the order card can appear on the board the moment it's created, not just once items exist. Don't treat `items: []` as "nothing to render" — render the order card using `orderNumber` / `orderStatus` alone in that case.

## `tableLabel` can be `null` while `tableId` is set

For an `OPEN` order (placeholder row, no items sent yet), `tableId` is populated but `tableLabel` stays `null` — the human-readable label is only resolved once the order is sent to kitchen. If you need to show a table name for an `OPEN` card and `tableLabel` is `null`, fall back to `tableId` or omit the table chip until `IN_PROGRESS`.

## Item-level vs order-level status

`item.status` and `orderStatus` are independent fields, both useful:
- `orderStatus` drives which **column** the card sits in.
- `item.status` drives per-item detail **within** a card (e.g. show a checkmark on items already `DELIVERED` while the order itself is still `IN_PROGRESS`).

## Reconnection

Standard `EventSource` auto-reconnect behavior applies (browser retries on drop). No `Last-Event-ID` / resume-from-offset support — on reconnect, treat the next message as a fresh full snapshot, same as page load.

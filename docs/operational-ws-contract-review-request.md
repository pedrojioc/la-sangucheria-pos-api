# Operational WebSocket Contract — Review Request for Backend

## Context

Pairing (device-code exchange, `docs/pairing-contract-review-request.md`) is confirmed and
implemented — thanks for the quick turnaround there. This is the same kind of request for the
**next** contract surface: the long-lived authenticated `/agent` WebSocket channel that carries
print jobs, device inventory, and status once the agent is paired.

`print-agent`'s design (`openspec/changes/printer-bridge-agent/design.md` §5.3) currently
documents a **PROPOSED, unconfirmed** shape for this channel — nothing has been built against
it yet, precisely because it's still marked "must be confirmed with the backend owner." Given
that pairing's real contract turned out to differ from what we'd proposed (generic envelope →
named events), we want to confirm this one *before* implementation starts, not after.

**The backend owns this decision — the agent adapts to whatever is confirmed.**

## What we already know is confirmed (from the pairing contract doc)

- Connect via `io("wss://<host>/agent", { auth: { key: apiKey } })` — Socket.IO, not raw WS.
- Named events, not a generic envelope: pairing used bare event names like `request-pairing-code`
  and `agent-credential`, not a `{type, id, ts, payload}` wrapper.
- Agent → Backend events already confirmed to exist on this namespace: `register-agent` (no
  payload, once per connection), `print-ack` (`{jobId}`), `report-devices` (`{devices: [...]}`).
- Backend → Agent: `agent-credential-rotated` (`{apiKey}`).
- Invalid/expired/revoked key → immediate disconnect, no error payload.

That's already more concrete than what §5.3 proposes below — this doc is mainly asking you to
fill in the rest using the same style (named events) rather than the generic envelope we'd
guessed at before pairing was confirmed.

## What the agent's design currently proposes (§5.3 — NOT confirmed, do not build against yet)

Envelope: `{ "type": string, "id": string, "ts": number, "payload": {...} }`.

**Backend → Agent** (proposed)

| type | payload | Agent action |
|------|---------|--------------|
| `connection.ack` | `{agentId}` | mark online |
| `job.push` | `{jobId, deviceRef, kind, contentType, content, idempotencyKey}` | durably enqueue, then ack |
| `config.stationAssignments.updated` | `{stations:[...]}` | update assignment cache |
| `device.testPrint` | `{jobId, deviceRef}` | enqueue a test job |
| `ping` | `{}` | reply pong (heartbeat) |

**Agent → Backend** (proposed)

| type | payload | Meaning |
|------|---------|---------|
| `job.ack` | `{jobId, status:"queued"}` | job durably received |
| `job.result` | `{jobId, status:"success"\|"deferred"\|"failed", printedAt?, reason?}` | terminal/interim result, idempotent by jobId |
| `device.status` | `{deviceRef, status:"online"\|"offline"\|"unknown", since}` | health transition |
| `agent.heartbeat` | `{devices:[{deviceRef, status}]}` | presence + rollup, every N seconds |
| `pong` | `{}` | heartbeat reply |

Note the already-confirmed `print-ack`/`report-devices` events don't map cleanly onto this
proposed table (`print-ack` looks like it might be the confirmed name for what we called
`job.ack`, but the payload shapes above haven't been reconciled against it). That mismatch is
exactly what this doc is trying to resolve.

## What this needs from backend

1. **Envelope**: named events (matching the pairing/rotation pattern already confirmed) or a
   generic `{type, ...}` wrapper? If named events, what are the real names — is `print-ack`
   the actual name for job acknowledgement, and does it carry more than `{jobId}` (e.g. a
   status field)?
2. **Job delivery**: what event pushes a job to the agent, and what does its payload contain?
   Specifically: is content pre-rendered ESC/POS, a template the agent renders itself, or does
   `contentType` distinguish the two? Is there an idempotency key distinct from `jobId`?
3. **Job result reporting**: is `print-ack` the only outbound signal, or is there a separate
   terminal result event (success/deferred/failed) distinct from the initial "received" ack?
   The agent's local retry/queue model (job-queue-retry spec) needs to report interim vs.
   terminal states, so we need to know if backend expects both or just one.
4. **`report-devices`**: is this the full inventory snapshot (replacing what we'd proposed as
   a separate `POST /agent/{agentId}/devices` REST call), or an incremental update? How often
   should the agent call it — on every discovery pass, only on change, or on an interval?
5. **Device/station config**: how does the agent learn which device is assigned to which
   station (e.g. "Cocina Principal" → a specific printer)? Pushed via an event, or pulled via
   REST on reconnect?
6. **Heartbeat / presence**: does backend need an explicit heartbeat from the agent, or is
   normal traffic (any message, same as credential-rotation's "next message triggers rotation
   check" behavior) sufficient to signal liveness? If explicit, what event and interval?
7. **Reconnection semantics**: on socket drop, does the agent just reconnect with the same
   `apiKey` and resume, or is there session/replay state (e.g. "did you miss any jobs while
   disconnected") the agent needs to request on reconnect?
8. **Status reporting fallback**: is there a REST fallback for status/device reporting if the
   WebSocket is down for an extended period, or is WS the only channel — no REST equivalent?

## What this does NOT ask for

This is not a request to unilaterally pick the agent's proposed shape. Whatever backend
confirms is what gets implemented — this doc exists so the operational contract is nailed down
with the same care pairing got, rather than the agent guessing and backend discovering the
mismatch after implementation starts.

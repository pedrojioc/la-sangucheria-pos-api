# Status Reporting Contract — Review Request for Backend

## Context

Pairing and the operational job-delivery contract are both confirmed and implemented. While
reviewing the confirmed operational contract (`docs/operational-ws-contract-review-request.md`
→ answers) against `print-agent`'s existing specs, we found that one already-written capability
— status/presence reporting — depends entirely on a mechanism the confirmed contract says does
not exist.

**The backend owns this decision — the agent adapts to whatever is confirmed.** This isn't a
request to add scope; it's flagging that a spec written earlier assumed something the real
contract doesn't have, before we build against it.

## What the agent's spec currently requires (unconfirmed, not yet built)

`openspec/changes/printer-bridge-agent/specs/status-reporting/spec.md` requires:

1. A periodic heartbeat from the agent so backend can distinguish "agent offline" from "agent
   silent but connected."
2. Per-printer online/offline reporting — a station with two printers where one goes down
   should show that specific printer as offline while the other stays online.
3. That data structured so the cloud admin UI can show station-level presence (e.g. "Cocina
   Principal sin conexión") derived from the printers assigned to it.
4. Status updates promptly reflecting a print failure, not waiting for a scheduled cycle.

## What the confirmed operational contract says (verbatim from the answers doc)

> **Q6 — Heartbeat/presence**: No heartbeat, no `ping`/`pong`, no interval of any kind — this
> is deliberate, not an oversight. Presence is inferred purely from the socket's own
> connect/disconnect lifecycle... If the agent goes quiet, backend has no way to distinguish
> "idle but fine" from "stuck" — this is an accepted trade-off, not a future TODO.

There is also no `device.status`-equivalent event anywhere in the confirmed event list
(`register-agent`, `print-ack`, `print-nack`, `report-devices` outbound;  `print-ticket`,
`agent-credential-rotated` inbound — nothing else exists on `/agent`). So today:

- Backend can tell "agent connected" vs. "agent disconnected" (whole-agent, from the socket
  itself) — nothing per-printer.
- Backend has no way to learn a specific printer went offline except indirectly, if a
  `print-nack` with `reason: "offline"` happens to arrive for a job targeting it — and even
  then, that's a one-off failure signal, not a live status a station can be shown as
  "recovered" from later.
- There is no "Cocina Principal sin conexión" signal available today — the admin UI has
  nothing to query for it beyond "is the agent's socket connected at all."

## The question

Is the gap between what this spec wants (per-station/printer presence in the admin UI) and
what the confirmed contract provides (whole-agent connect/disconnect only) an **accepted
scope reduction** — same category as the other confirmed gaps (no heartbeat, no reconnect
replay, no REST fallback, manual station↔device linking) — or does backend want to add a
mechanism for it?

Concretely:

1. Is per-printer online/offline status something the admin UI is expected to show at all in
   the near term, or was that a print-agent-side assumption that got ahead of an actual
   product requirement?
2. If it is wanted: would backend prefer the agent to fold status into the existing
   `report-devices` event (e.g. adding a `status` field per device, sent more frequently than
   the 15-minute staleness window) rather than a new dedicated event? That would reuse a
   contract surface that already exists instead of adding one.
3. If per-printer status isn't wanted, should `report-devices`'s existing behavior (upsert +
   15-minute staleness flag) be considered the entire "status" story, and the admin UI only
   ever shows "seen recently" vs. "stale" rather than a live online/offline state?
4. Either way — is whole-agent presence (the socket's own connect/disconnect, already
   confirmed) sufficient for showing "agent unreachable" in the admin UI today, or is there a
   need for the agent to explicitly signal something on a clean disconnect (e.g. graceful
   shutdown vs. crash) that the socket lifecycle alone can't distinguish?

## What this does NOT ask for

This is not a request to add a heartbeat or reconnect-replay mechanism — those were already
confirmed as deliberate, accepted trade-offs in the operational contract review and this
doesn't reopen them. This is scoped narrowly to per-printer/station presence reporting, which
is a separate, not-yet-built capability with no confirmed mechanism at all yet — either it's
descoped to match what already exists, or backend tells us what to build against.

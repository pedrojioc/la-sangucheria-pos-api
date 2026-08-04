# Pairing Contract — Review Request for Backend

## Context

`print-agent` implemented the device-code pairing flow against a **proposed**
contract (documented in `openspec/changes/printer-bridge-agent/design.md`
§5, explicitly marked "PROPOSED — must be confirmed with the backend
owner"). We've now received the actual contract backend is building against
(`docs/print-agent-integration-contract.md`), and it uses a materially
different approach.

This doc lays out both approaches and the concrete trade-offs, so backend
can decide whether to keep their current approach or switch to the one the
agent already implements. **The backend owns this decision — the agent
adapts to whatever is confirmed.** This is not a request to override
backend's design; it's a request to review a robustness gap before it's
locked in on both sides.

## The two approaches

### A — Implemented in the agent (OAuth device-code style)

- **Transport**: HTTP REST. `POST /agent/pairing/start`, `POST
  /agent/pairing/poll` (agent-initiated, stateless polling).
- **Credential**: short-lived access token + refresh token pair
  (`accessToken`, `refreshToken`, `tokenExpiresAt`). Agent refreshes ahead
  of expiry via `POST /agent/token/refresh`.
- **State ownership**: backend holds all pairing state keyed by
  `deviceCode`. The agent holds nothing but that code — if the agent
  process restarts mid-flow, it just resumes polling with the same code.

### B — Backend's actual contract (Socket.IO push style)

- **Transport**: WebSocket, unauthenticated namespace `/agent/pairing`.
  Agent emits `request-pairing-code`, backend pushes `pairing-code` then
  later pushes `agent-credential` asynchronously on the same socket
  connection.
- **Credential**: single `apiKey`, no built-in expiration. Rotation is
  described as backend-side/transparent with a 48h grace window.
- **State ownership**: state lives in the open socket connection. If the
  socket drops between `pairing-code` and `agent-credential`, the contract
  doc itself says (§ "Reconnection semantics"): reconnecting and resending
  the same `code` will get the credential back "if the backend still has it
  pending" — otherwise **nothing is delivered and the agent must request a
  fresh code**, which requires the admin to redeem again.

## Trade-off analysis

| Dimension | A (implemented) | B (contract) |
|---|---|---|
| Client-side statefulness | Stateless — agent only needs `deviceCode`, resumes by polling | Stateful — credential delivery is tied to one socket connection's lifetime |
| Failure mode on disconnect mid-flow | None — next poll just works | Possible silent credential loss if backend lost pending state (e.g. backend restart); contract explicitly documents this as expected, requiring a fresh code + re-redemption by an admin |
| Credential lifetime | Short-lived access token, refreshed regularly | Long-lived `apiKey`, no self-expiry |
| Exposure window if credential is exfiltrated from the PC | Bounded by token TTL + refresh rotation | Unbounded until backend explicitly revokes |
| Transport complexity for a one-time flow | Simple: REST request/response, trivially retryable, curl-debuggable | Requires maintaining a live socket for a flow that happens once per install, plus reconnect/backoff handling |
| Operational debuggability | Standard HTTP semantics/status codes | Requires socket-level tooling to inspect |

**Conclusion**: Approach A is more robust on two independent axes —
statelessness under disconnection, and bounded credential exposure. Approach
B is simpler to implement on a system that already has a WebSocket
connection for other purposes, and pushes the credential the moment it's
ready instead of waiting for the next poll tick (a UX latency improvement
of at most `interval` seconds, typically a few seconds).

## Questions for backend

1. Is there a reason `apiKey` is designed as non-expiring rather than a
   refreshable short-lived token? (e.g. simplicity, matches an existing
   pattern elsewhere in the system, expected agent uptime assumptions)
2. Is the pairing namespace's credential-loss-on-reconnect behavior (§
   "Reconnection semantics" in the contract doc) an accepted trade-off, or
   would backend prefer to close that gap?
3. What would it take on backend's side to switch to approach A (REST
   device-code + refresh token)? Specifically:
   - Is there existing REST infrastructure for agent-facing endpoints, or
     would this be new?
   - Does the normal-operation authenticated channel (§3 of the contract
     doc, WebSocket `/agent`) have any dependency on the pairing mechanism
     being WebSocket-based, or are they fully independent?
   - Rough sizing: is this a small adjustation (same underlying
     state/redemption logic, different transport) or a larger rework?
4. If backend prefers to keep approach B, are they open to closing the
   "credential loss on reconnect" gap specifically (e.g. persisting pending
   pairing state in a store instead of only in-memory/socket-scoped), even
   if the rest of the design stays as-is?

## What this does NOT ask for

This is not a request to unilaterally switch backend's implementation. The
agent will implement whatever backend confirms — this doc exists so that
decision is made with the robustness gap visible, not discovered later.

# Device Identity Mapping — Review Request for Backend

## Context

Implementing Phase 5 (job delivery) against the confirmed operational contract surfaced a
mismatch that, unlike the status-reporting gap (`docs/status-reporting-contract-review-
request.md`), blocks job delivery itself from working correctly — not a nice-to-have, a
correctness bug waiting to happen in production. Flagging before it ships rather than after.

## The mismatch

`report-devices` (agent → backend) sends each discovered device identified by the agent's own
internal `deviceRef` — a string the agent generates itself during discovery, e.g.
`spooler:EPSON_TM_T20` (USB, from the Windows spooler queue name) or `lan:192.168.1.50:9100`
(LAN, from mDNS/subnet scan). This is purely a local identifier with no meaning outside the
agent's own process.

The confirmed contract doc says backend matches `report-devices` entries by
`(connectionType, usbIdentifier or address)` — fields that don't exist in what the agent
currently sends (it sends `deviceRef`, `transport`, `spoolerQueue`, `host`, `port`, `model`,
`status` — no `connectionType`, no `usbIdentifier`).

Separately, `print-ticket` carries `ticket.printerAddress` — described as what an admin
manually types into the station-config UI, matched against whatever `report-devices` showed
them in the discovered-devices inventory (`GET /discovered-printer-devices`). The agent
currently treats `printerAddress` as if it were directly usable as the local `deviceRef` to
resolve which local device to print to — but if the admin is typing in a value shaped like
`usbIdentifier`/`address` (whatever backend's matching key actually is), that will not match
the agent's own `spooler:...`/`lan:...` format, and the agent will fail to resolve the device
for every real job.

## What this needs from backend

1. What are the actual field names/formats for `report-devices`' matching key —
   `connectionType` + `usbIdentifier`/`address` as the confirmed-contract doc states, or
   something else? What does the agent need to send (in addition to, or instead of, its own
   `deviceRef`) for backend's upsert-matching to work as intended?
2. When an admin picks a device in the station-config UI (the source of `printerAddress`),
   what value actually gets stored and later sent back in `print-ticket.ticket.printerAddress`
   — is it the exact `usbIdentifier`/`address` value the agent reported via `report-devices`,
   or something else (e.g. a backend-generated ID unrelated to anything the agent sent)?
3. Given the answer to (2): should the agent resolve `printerAddress` by looking it up against
   its own locally-stored device inventory using whatever key backend confirms in (1), rather
   than treating `printerAddress` as directly equal to the agent's internal `deviceRef`? If so,
   the agent needs a stable mapping from "the identifier backend hands back" to "the local
   device the agent already knows about" — which only works if (1) and (2) use the same
   identifier space.

## What this does NOT ask for

Not asking backend to adopt the agent's internal `deviceRef` format — that's a local
implementation detail the agent can adapt however's needed once the actual matching-key
contract is clear. This is scoped to understanding what identifier space `report-devices` and
`print-ticket.printerAddress` actually share, so the agent can map between "its own device
inventory" and "what backend hands back" correctly.

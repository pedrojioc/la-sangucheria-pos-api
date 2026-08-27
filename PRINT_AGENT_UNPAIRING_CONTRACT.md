## Agent Unpairing — SDD Archive Report

**Status**: COMPLETE — Change closed and verified.

### Executive Summary

The `agent-unpairing` change adds a `DELETE /agent-pairing` endpoint that allows admins to unpair (revoke) the active print agent credential on demand, replacing the previous TTL-only expiration model. The change is purely additive, reuses the existing `RevokeAgentCredential` use case, and is idempotent when called repeatedly. Verification passed (0 CRITICAL, 1 non-blocking WARNING about pre-existing auth guard test convention).

### Artifact Chain (topic_key references for traceability)

| Artifact | Engram ID | Topic Key | Status |
|---|---|---|---|
| Exploration | 396 | `sdd/agent-unpairing/explore` | Complete |
| Proposal | 397 | `sdd/agent-unpairing/proposal` | Complete |
| Spec (delta) | 400 | `sdd/agent-unpairing/spec` | Complete |
| Design | 401 | `sdd/agent-unpairing/design` | Complete |
| Tasks (TDD) | 404 | `sdd/agent-unpairing/tasks` | Complete (8/8 done) |
| Apply-Progress | 405 | `sdd/agent-unpairing/apply-progress` | Complete (8/8 tasks shipped) |
| Verify-Report | 406 | `sdd/agent-unpairing/verify-report` | PASS (0 CRITICAL, 1 WARNING) |
| **Archive-Report** | **407** | **`sdd/agent-unpairing/archive-report`** | **This file** |

### Key Decisions & Tradeoffs

1. **Reuse over rewrite**: Inject `RevokeAgentCredential` as a dependency, do not duplicate the revoke rule in `agent-gateway`. Keeps the rule in one tested place; refactoring revoke later only touches one module.

2. **Idempotency in the use case, not the controller**: `NoActiveAgentCredential` is caught by `UnpairAgent.run()`, not the controller. Idempotency is an operation property (unit-testable, applies to any caller), not a transport accident.

3. **Best-effort socket notify, not forced disconnect**: Emit `'agent-unpaired'` via existing registry (consistent with `agent-credential-rotated`). Do not extend `AgentConnection` interface with `disconnect()` — credential revoke already blocks re-auth, so safety never depends on agent-side cooperation. Try/catch the emit; a dead socket does not fail the request.

4. **VO-in, `.value` at the boundary**: `UnpairAgent.run(establishmentId: EstablishmentId)` accepts the VO, unwraps to `.value` only when calling downstream. Matches `GetAgentPairingStatus` sibling precedent. Type narrowing stays at the outer edge.

5. **No new guard**: Reuse the existing global JWT admin guard. No `@Public()` needed, no new permission layer.

### Implementation Scope (6 files, ~190 LOC)

**Created**:
- `src/contexts/kitchen-operations/agent-gateway/application/unpair/unpair-agent.ts` — pure class, composes `RevokeAgentCredential` + `AgentConnectionRegistry`
- `tests/contexts/kitchen-operations/agent-gateway/application/unpair-agent.spec.ts` — 5 test cases (revoke+emit, no-connection, idempotent, error propagation, emit-failure isolation)

**Modified**:
- `src/contexts/kitchen-operations/agent-gateway/presentation/http/agent-pairing.controller.ts` — add `@Delete()` handler, 4th constructor param
- `src/contexts/kitchen-operations/agent-gateway/agent-gateway.module.ts` — add `UnpairAgent` registration (no duplicate of `RevokeAgentCredential`)
- `tests/contexts/kitchen-operations/agent-gateway/presentation/http/agent-pairing.controller.spec.ts` — add unpair cases
- `tests/contexts/kitchen-operations/agent-gateway/agent-pairing-flow.integration.spec.ts` — extend with unpair + re-pair flow, fixed compile break

**Untouched**:
- `PairingCode` — not cleaned up on unpair (single-use, short-lived; re-pair issues fresh code)
- `DiscoveredPrinterDevice` — not touched (hardware records outlive any single pairing)
- `RevokeAgentCredential` — consumed unchanged, not re-registered
- `AgentConnectionRegistry` — consumed unchanged, no new methods added

### Verification Evidence

From verify-report (#406):
- **All 8 tasks (T1-T8) complete**: unit specs passing, integration spec passing, no lint issues, tsc clean.
- **Test coverage**: `pnpm test` → 885/886 passing (1 pre-existing skip, unrelated). Targeted `agent-pairing` suites all pass. Targeted `unpair-agent.spec.ts` 5/5 pass.
- **Spec compliance**: All scenarios covered by tests (revoke, idempotency, ordering, error isolation, integration flow).
- **Design coherence**: VO-in/`.value`-at-boundary, idempotency-in-use-case, best-effort-notify, no guard changes — all followed as designed.

**Verdict**: PASS
- 0 CRITICAL issues
- 1 WARNING (non-blocking): No dedicated HTTP-guard-level test for `DELETE /agent-pairing` auth requirement (mirrors pre-existing project convention for `status`/`redeem`, not a regression)
- 0 SUGGESTION issues

### Rollback Path

Revert the commit. The change is purely additive: one endpoint, one use case, one module provider line. No migration, no schema change, no modification to existing behavior. `status` and `redeem` remain untouched. Credentials already revoked in production stay revoked (correct behavior — establishments simply re-pair).

### Open Artifacts / Post-Delivery Follow-Up

None. The change is complete and closed. No post-delivery tickets or follow-up work needed.

### Final Checklist

- [x] All exploration findings documented and fed forward (proposal #397)
- [x] Proposal reviewed, decisions validated, scope locked (spec #400)
- [x] Design reviewed, architecture coherence confirmed (design #401)
- [x] TDD tasks ordered and complete (tasks #404, apply-progress #405)
- [x] Implementation verified against spec + design (verify-report #406)
- [x] No CRITICAL or unresolved SUGGESTION issues
- [x] Code compiles, tests pass (885/886), no new lint issues
- [x] Rollback path clear
- [x] Archive report written and persisted

**SDD Cycle for `agent-unpairing` is closed.**

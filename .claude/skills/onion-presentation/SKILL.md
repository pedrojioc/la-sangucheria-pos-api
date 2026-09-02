---
name: onion-presentation
description: "Trigger: presentation layer, controller, HTTP endpoint, WebSocket gateway, request DTO, exception filter. Enforce Presentation layer conventions (thin controllers, error mapping)."
license: Apache-2.0
metadata:
  author: "pedro"
  version: "1.0"
---

## Activation Contract

Load this skill together with `onion-architecture` (base), `onion-domain`, and `onion-application` whenever creating or modifying anything under `presentation/`: controllers, WebSocket gateways, request DTOs, exception filters. Extends base skill Rule 6 (request validation lives here) and Rule 5 (response DTOs come from Application, unmodified) — never contradicts them.

## Hard Rules

1. A controller (or WebSocket gateway) is a thin driving adapter: extract primitives from the request DTO, call exactly one use case/query, return its result. No business logic, no direct repository/infrastructure references.
2. A controller never imports a Domain aggregate/entity type. If a query hands back something that forces the controller to reference a domain type just to shape a response, that's a signal the DTO+mapping boundary is in the wrong place — fix it in Application (base skill Rule 5), don't compensate for it here.
3. Exactly one exception filter is registered globally, mapping the Domain exception hierarchy (`InvalidValueObjectException`→400, `BusinessRuleViolationException`→422, `NotFoundException`→404, per `onion-domain` Rule 7) to HTTP status codes. Never add a second filter "just in case" — an unregistered filter is dead code that silently misleads whoever reads it next.
4. Guards/interceptors/pipes making an access-control or cross-cutting decision (auth, throttling) are driving-adapter concerns, wired once at the composition root. They only make technical/access decisions — never business rules.
5. WebSocket gateways follow the same rules as HTTP controllers — a different transport for the same driving-adapter role, not an exception to any of the above.

## Decision Gates

| Situation | Action |
| --- | --- |
| A query returns a domain object and the controller needs to shape a response | Fix it in Application (base skill Rule 5) — don't map domain→DTO in the controller |
| A new kind of error needs a distinct HTTP status | Add the specific `DomainException` subclass in `onion-domain`, extend the one registered filter — don't add a second filter |
| Need to gate an endpoint by auth/role/rate | A Guard, wired at the composition root |
| A new real-time/WebSocket entry point is needed | Same rules as a controller: thin, one use case, no business logic |

## Execution Steps

1. Define/extend the request DTO with validation decorators.
2. Controller method: extract primitives from the request DTO, call the use case's `run()`.
3. Return whatever Application handed back — it's already a Response DTO (base skill Rule 5); do not reshape it here.
4. An error case needing a distinct HTTP status is an `onion-domain` exception-subclass decision, mapped once in the single registered filter — not a controller-level try/catch.
5. Never import a Domain entity/aggregate type into a controller or gateway file.

## Output Contract

Report: endpoint(s)/gateway(s) touched, confirmation no Domain type was imported, and confirmation the response came from Application unmodified.

## References

- `references/rationale.md` — sourcing (Microsoft Learn's UI Layer types, composition root) and the concrete `recipe.controller.ts` case this skill's Rule 2 generalizes from.

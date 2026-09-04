---
name: onion-application
description: "Trigger: application layer, use case orchestration, query service, domain event subscriber, application exception, integration event, cross-context event. Enforce Application layer conventions (orchestration, reads, event handling)."
license: Apache-2.0
metadata:
  author: "pedro"
  version: "1.0"
---

## Activation Contract

Load this skill together with `onion-architecture` (base) and `onion-domain` whenever creating or modifying anything under `application/`: use cases, subscribers, query services, application exceptions. Extends the base skill's Rules 3-5 (plain use cases, cross-context ports, response DTOs) — never contradicts them.

## Hard Rules

1. A use case's `run()` saves through exactly one repository (one aggregate, per `onion-domain` Rule 4). If it seems to need two aggregates saved together, split it — the second effect is a Domain Event handled separately.
2. Domain Event subscribers live in `application/subscribers/`. They react to events raised in Domain and reach other aggregates/bounded contexts only through Ports (base skill Rule 4) — never by importing another context's domain/application directly.
3. Use a Query Service port (`application/services/*-query.service.ts`, `abstract class`, returns DTOs) only when the read shape genuinely diverges from the aggregate: paginated/filtered lists, or projections combining data from multiple aggregates. For a lookup that matches the aggregate's own shape, use the domain repository directly — do not duplicate the read mechanism without a real divergent shape to justify it.
4. Domain exceptions (`InvalidValueObjectException`, `BusinessRuleViolationException`, `NotFoundException` from `onion-domain`) are the only exception hierarchy. `application/exceptions/` is a location for checks that need orchestration context only the use case has (e.g., a loaded configuration) — it is not a separate taxonomy. Never invent an `ApplicationException` base class.
5. `run()` receives primitives (already shaped by the Presentation request DTO) and builds Value Objects / calls Aggregate methods to get domain validation for free. Do not re-check a business rule in the use case that the domain object already enforces.
6. A subscriber consuming a Domain Event raised in a *different* bounded context translates the payload into its own local types immediately on receipt — no domain type (VO, enum, entity) from the raising context propagates past the subscriber. Subscribing to the event itself is fine (that's what Domain Events are for); the violation is letting a foreign domain type leak into your own local types afterward. If the raised event's own shape isn't fit for external consumption (unstable, exposes VOs/entities directly instead of primitives), the raising context defines a dedicated Integration Event and translates to it explicitly — other contexts subscribe to that, never the raw internal event.

## Decision Gates

| Situation | Action |
| --- | --- |
| A use case needs to persist changes to two aggregates | Split it; raise a Domain Event for the second aggregate's reaction |
| A read needs data shaped differently than any single aggregate | Add/reuse a Query Service port |
| A read matches the aggregate's own shape (e.g. `findById`) | Use the domain repository, no Query Service needed |
| A check requires data the use case loaded (not visible to the entity itself) | Throw the matching `DomainException` subclass from `application/exceptions/` |
| Considering a command bus / `CommandHandler` for a use case | Don't — base skill Rule 3 rejects it; a single-datastore project gets no benefit from it (see rationale) |
| Subscribing to a Domain Event raised by another bounded context | Translate its payload to local types immediately on receipt |
| The raised event exposes VOs/entities directly, or its shape changes often | Escalate: raising context defines a dedicated Integration Event, subscribers use that instead |

## Execution Steps

1. Identify the aggregate the use case belongs to and confirm it touches exactly one repository.
2. Write `run()`: accept primitives, construct/load the aggregate, call its behavior methods, save through the one repository.
3. If another aggregate/context needs to react, raise the event in Domain and add a subscriber here that calls it through a Port.
4. If the caller needs a read shape the aggregate doesn't provide, add a Query Service port here and implement it in Infrastructure.
5. Any check that fails should surface a `DomainException` subclass — never a bespoke error type.
6. Subscribing to another bounded context's Domain Event: translate its payload to local types inside the subscriber before using it further. Never pass the foreign event's domain types into your own local interfaces/DTOs.

## Output Contract

Report: use case(s) touched, whether a Query Service was added (and why the read shape justified it), any Domain Event subscriber added (and whether it consumes a same-context or cross-context event, and how the payload was translated), and confirmation no command bus / second-aggregate-in-one-transaction pattern was introduced.

## References

- `references/rationale.md` — CQRS sourcing (Fowler, Microsoft Azure Architecture Center), Domain Event vs. Integration Event sourcing (Cesar de la Torre / Microsoft Learn, Vaughn Vernon's Published Language, Hohpe & Woolf's Message Translator), and the real-world cases from `lasangucheria-pos` showing where each pattern was over-applied vs correctly applied.

---
name: onion-domain
description: "Trigger: domain layer, entity, value object, aggregate, domain event, domain service, domain exception. Enforce DDD tactical rules inside the Domain layer."
license: Apache-2.0
metadata:
  author: "pedro"
  version: "1.0"
---

## Activation Contract

Load this skill together with `onion-architecture` (base) whenever creating or modifying anything under `domain/`: entities, value objects, aggregates, domain services, domain events, domain exceptions. This skill extends the base skill's Rule 1 (domain has zero outward dependencies) — it never contradicts it.

## Hard Rules

1. Value Objects are immutable and self-validating: no code path may construct an invalid instance (validate in the constructor or a `create()` factory). Domain concepts with meaning beyond a bare primitive (money, quantities, email, phone, ids) are Value Objects, never raw `string`/`number`.
2. Entities/Aggregates never expose public setters. State changes only happen through methods that enforce the object's own invariants.
3. Each Aggregate has exactly one root. External code (Application, other aggregates, subscribers) calls the root only — never reaches into its internal collaborators directly.
4. One transaction per Aggregate. Cross-aggregate consistency is handled via Domain Events raised from the root, never by mutating two aggregates inside the same use case.
5. Domain Events are past-tense (`OrderClosed`, not `CloseOrder`), immutable, and raised from the aggregate root. Domain only defines/raises events — handling (side effects, calling other aggregates, persistence) is an Application-layer concern, never Domain.
6. Domain Services hold logic that doesn't belong to one entity/VO. They're stateless and operate only on domain objects already in memory — they never call a repository or any infrastructure port; Application loads data and passes it in.
7. Domain exceptions signal exactly one thing: an invariant was violated on data already inside the domain. Use `InvalidValueObjectException` when the value/data itself is invalid (thrown by VOs/entities validating their own fields) and `BusinessRuleViolationException` when otherwise-valid data breaks a business rule. `NotFoundException` is not a domain invariant — it belongs to the repository/Application layer when a lookup fails, never thrown by an entity/VO about itself. Never throw plain `Error`. File suffix always `.exception.ts`.

## Decision Gates

| Situation | Action |
| --- | --- |
| Rule depends only on the object's own fields | Enforce in the VO/Entity constructor or factory, throw `InvalidValueObjectException` |
| Rule depends on business context/state (stock, status, policy) | Enforce in the Aggregate Root method, throw `BusinessRuleViolationException` |
| A repository lookup by id returns nothing | Throw `NotFoundException` from the repository or the use case — not from the entity |
| Logic needs to touch two aggregates | Raise a Domain Event, handle the second aggregate's change in Application — never call it directly |
| A domain concept has validation rules beyond a bare primitive | Wrap it in a Value Object |

## Execution Steps

1. Identify whether the change is a new Value Object, new Entity/Aggregate behavior, or a new Domain Event.
2. Value Object: make it immutable, validate every construction path, throw `InvalidValueObjectException` on bad input.
3. Entity/Aggregate behavior: add a method on the root (never a public setter) that enforces the invariant, throws `BusinessRuleViolationException` if violated.
4. Cross-aggregate reaction needed: raise a past-tense Domain Event from the root instead of calling the other aggregate.
5. Domain code still imports nothing from Application, Infrastructure, or any framework/ORM package (base skill Rule 1).

## Output Contract

Report: domain objects touched/created, which exception subclass was used and why, and any new Domain Event raised — with confirmation its handler lives in Application, not Domain.

## References

- `references/rationale.md` — sourced justification (Evans, Vernon, Fowler, Microsoft Learn) and the explicit note on where the project's own exception hierarchy is a pragmatic convention rather than DDD-tactical canon.

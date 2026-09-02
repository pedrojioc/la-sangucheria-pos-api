---
name: onion-infrastructure
description: "Trigger: infrastructure layer, repository implementation, adapter, ORM entity, TypeORM, composition root, module wiring. Enforce Infrastructure layer conventions (persistence, adapters, DI wiring)."
license: Apache-2.0
metadata:
  author: "pedro"
  version: "1.0"
---

## Activation Contract

Load this skill together with `onion-architecture` (base), `onion-domain`, and `onion-application` whenever creating or modifying anything under `infrastructure/`: repository implementations, adapters, query-service implementations, module wiring. Infrastructure only ever *implements* ports defined by inner layers — it never defines new rules.

## Hard Rules

1. ORM/persistence models (e.g. TypeORM `@Entity()` classes) are separate classes from Domain Entities/Aggregates. Repository implementations map explicitly between them; the ORM model never leaks outside `infrastructure/persistence/`.
2. `infrastructure/persistence/*` implements the repository abstract class from `domain/repositories/`. `infrastructure/query-services/*` implements the query-service abstract class from `application/services/` and builds its DTO straight from the query — no domain objects in the read path.
3. Cross-bounded-context adapters (implementing an `application/ports/*.port.ts`) call the other context's use case — its Application-layer entry point, acting as that context's public service — never its Domain objects. This is what keeps each context's internal model private and swappable.
4. A concrete Infrastructure class is wired to its abstract-class token only inside the owning module's composition root (`*.module.ts`). No other file constructs or statically references a concrete Infrastructure class.
5. Infrastructure never introduces a business rule. If an adapter/repository method needs a decision beyond fetch/persist/translate, that decision belongs in Domain or Application, not here.

## Decision Gates

| Situation | Action |
| --- | --- |
| Persisting a domain aggregate | Map explicitly to/from a separate ORM model inside the repository implementation |
| A read can skip the domain model entirely | Implement the query-service port, build the DTO straight from the query result |
| A use case needs something from another bounded context | Implement the port by calling that context's use case — never its domain |
| Wiring a concrete class to its abstract token | Only inside the module's composition root |
| An adapter/repository seems to need an `if` on business meaning (not just shape) | Stop — that decision belongs in Domain or Application |

## Execution Steps

1. Identify which port/abstract-class this code implements: a Domain repository, an Application query-service, or an Application ACL port.
2. Implement it in the matching `infrastructure/` subfolder — translation and I/O only, no business rules.
3. Persisting an aggregate: map domain ↔ ORM model explicitly in both directions.
4. Satisfying a cross-context port: call the other context's use case, adapt its result/errors to your own port's contract.
5. Register the concrete class against its abstract token only in the module's composition root.

## Output Contract

Report: which port/abstract class was implemented, whether it crosses a bounded context, and confirmation no business rule was introduced in Infrastructure.

## References

- `references/rationale.md` — sourcing (Evans/Fowler on Anticorruption Layer and Open Host Service, Microsoft Learn on composition root) and the project's own correctly-implemented example this rule generalizes from.

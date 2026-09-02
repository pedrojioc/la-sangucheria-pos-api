# Rationale — Infrastructure layer rules

Sourced justification for each Hard Rule in `SKILL.md`.

## Rule 1 — ORM models separate from Domain entities

Direct consequence of `onion-architecture` Rule 1 (domain has zero outward dependencies) and `onion-domain` Rule 1/2 (entities/VOs are plain domain objects, not framework types). If a TypeORM `@Entity()` decorator sat on a domain class, the domain would depend on `typeorm` — a framework/infrastructure package — which breaks the dependency rule outright.

Project check: confirmed empirically — all 44 `@Entity()` usages in `lasangucheria-pos` are in `infrastructure/`, none in `domain/`. This rule documents an already-solid pattern, not a fix.

## Rule 2 — Repository and query-service implementations

Microsoft Learn: "This functionality is achieved by defining abstractions, or interfaces, in the Application Core, which are then implemented by types defined in the Infrastructure layer." — [Common web application architectures](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures). Applied here to both the Domain-owned repository ports and the Application-owned query-service ports (see `onion-application` Rule 3 for when the latter is justified).

## Rule 3 — Cross-context adapters call the other context's use case, not its domain

This rule combines two DDD Context Mapping patterns (Eric Evans, *Domain-Driven Design*, strategic design section):

- **Anticorruption Layer**: "a layer within the downstream context that translates to/from the upstream model to protect the downstream model from influence by the upstream model" — the most defensive form of context integration.
- **Open Host Service**: "when a bounded context offers a protocol or a set of services that other bounded contexts can consume" — the upstream context's *public* entry point, as opposed to its internal model.

Neither Evans nor Fowler's bliki spells out "call their use case, not their domain" as a literal sentence — that specific framing is this skill's synthesis of the two patterns, applied to a modular monolith where all contexts share one codebase (so nothing stops you from importing another context's domain classes directly unless you choose not to). The synthesis is validated against the project's own one correctly-implemented example: `TypeOrmEstablishmentSettingsAdapter` (implementing `EstablishmentSettingsPort`) imports and calls `GetEstablishmentSettings`, a **use case** in the `establishment` context — never an `establishment` domain object. That use case is `establishment`'s Open Host Service; the adapter is `orders`' Anticorruption Layer against it. — [Anticorruption Layer / Open Host Service summaries](https://medium.com/continuousdelivery/anti-corruption-layer-e24e2025be6f), [Bounded Context (Fowler bliki)](https://martinfowler.com/bliki/BoundedContext.html)

Project check: this is the one pattern the project got right in exactly one place, and got wrong everywhere else — `deduct-ingredients-on-order-closed.ts`, `register-item-reception.ts`, `create-product.ts`, and the kitchen-printer subscribers all import other contexts' `domain/`/`application/` objects directly instead of going through a port+adapter pair like this one. This skill (together with `onion-architecture` Rule 4) generalizes the one correct example to every cross-context call.

## Rule 4 — Composition root only

Microsoft Learn: "The place where this logic is performed is known as the app's composition root, and is what allows dependency injection to work properly at run time," and explicitly: "No direct instantiation of or static calls to the Infrastructure layer types should be allowed" outside of it. — [Common web application architectures](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures)

## Rule 5 — No business rules in Infrastructure

Direct consequence of the dependency rule (Palermo, Martin, Microsoft — see `onion-architecture` Rule 1 rationale): Infrastructure is the outermost, most replaceable layer. If it encoded business rules, replacing the ORM or the HTTP client would risk silently changing business behavior — exactly what the dependency rule exists to prevent.

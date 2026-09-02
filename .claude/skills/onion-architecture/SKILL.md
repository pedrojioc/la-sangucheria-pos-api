---
name: onion-architecture
description: "Trigger: onion architecture, bounded context, use case, repository, domain layer, cross-context call. Enforce the dependency rule and layer boundaries when implementing features."
license: Apache-2.0
metadata:
  author: "pedro"
  version: "1.0"
---

## Activation Contract

Load this skill whenever implementing, reviewing, or reorganizing code inside a project structured as Domain / Application / Infrastructure / Presentation (Onion Architecture). This is the base skill — layer-specific rules (domain, application, infrastructure, presentation) live in their own skills and extend, never contradict, this one.

## Hard Rules

1. Dependencies point inward only: Presentation and Infrastructure depend on Application; Application depends on Domain. Domain never imports Application, Infrastructure, or any framework/ORM package.
2. Domain defines its own repository ports as `abstract class` under `domain/repositories/`. Infrastructure implements them under `infrastructure/persistence/`. The abstract class itself is the DI token — never a separate `interface` + `Symbol` pair.
3. A use case is a plain class with one public `run()` method, named as a verb phrase (`CreateProduct`, not `CreateProductUseCase`). No command/query bus, no `execute()`/`handle()`.
4. A call that crosses bounded contexts (e.g. `orders` needing `inventory`) always goes through a port defined in the caller's `application/ports/*.port.ts`, implemented by an adapter in `infrastructure/adapters/*.adapter.ts`. Never import another context's `domain/` or `application/` directly.
5. Response DTOs live in `application/dto/*.response.ts` with a static `fromAggregate(...)` factory. The use case returns this DTO, never the raw aggregate. Presentation only forwards or serializes it — it does not redefine the shape.
6. Request validation lives in `presentation/http/dto/*.request.ts`. The controller extracts primitives and passes them into `run()`; Application never receives a framework-specific request object.

## Decision Gates

| Situation | Action |
| --- | --- |
| Use case needs data from another bounded context | Define/reuse a port in `application/ports/`, implement it in `infrastructure/adapters/` |
| Use case needs data from another aggregate in the *same* context | Direct call is fine, no port required |
| Deciding where a response shape lives | Always `application/dto/`, never `presentation/dto/` |
| Domain needs something external (DB, clock, id generator) | Define an abstract-class port in `domain/` (or `application/` if it's application-specific), implement in `infrastructure/` |

## Execution Steps

1. Identify the bounded context and aggregate the feature belongs to.
2. Add/extend domain entities and value objects — zero outward imports.
3. Add any needed ports in `domain/repositories/` or `application/ports/`.
4. Write the use case as a plain class with `run()`.
5. Add the response DTO in `application/dto/`.
6. Implement infrastructure adapters/repositories against the ports from step 3.
7. Wire the controller: request DTO in → `run()` → response DTO out.
8. Register everything in the module's composition root.

## Output Contract

Report: layers touched, any new ports/adapters created, and explicit confirmation that no inward dependency rule was violated.

## References

- `references/rationale.md` — sourced justification for each hard rule (Palermo, Robert C. Martin, Microsoft Learn) and where the project's own code deviated.
- Layer-specific skills (`onion-domain`, `onion-application`, `onion-infrastructure`, `onion-presentation`) — not yet created; add them as recurring layer-specific corrections come up.

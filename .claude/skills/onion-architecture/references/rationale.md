# Rationale — Onion Architecture base rules

Sourced justification for each Hard Rule in `SKILL.md`, plus what the reference project (`lasangucheria-pos`) got right or wrong on each point. Kept out of `SKILL.md` to stay within the skill token budget — read this when you need the "why."

## Rule 1 — Dependencies point inward only

- Jeffrey Palermo (creator of the term, 2008): "The fundamental rule is that all code can depend on layers more central, but code cannot depend on layers further out from the core." — [Onion Architecture Part 1](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
- Robert C. Martin: "Source code dependencies can only point inwards. Nothing in an inner circle can know anything at all about something in an outer circle." — [The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- Microsoft Learn: "dependencies flow toward the innermost circle... the Application Core has no dependencies on other application layers." — [Common web application architectures](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures)
- Project check: confirmed empirically — zero `domain/` files import `@nestjs/*` or `typeorm`. This is the one rule the project already followed perfectly everywhere.

## Rule 2 — Repository ports as abstract class, defined in Domain

- Palermo's tenet #2: "Inner layers define interfaces. Outer layers implement interfaces."
- Microsoft Learn: "This functionality is achieved by defining abstractions, or interfaces, in the Application Core, which are then implemented by types defined in the Infrastructure layer."
- Project check: 37 of 39 repositories followed this via `abstract class` used directly as the DI token. 2 outliers used `interface` + `Symbol` instead (`ProductCategoryRepository`, `UnitRepository`) — functionally equivalent but a second mechanism for the same job. The skill standardizes on the majority pattern since it needs no extra token/symbol wiring.

## Rule 3 — Plain use case class with `run()`, no bus

- Palermo's original design never mandates a command/query bus — Application Services simply orchestrate domain objects.
- This was a genuine fork with no single "correct" answer from authoritative sources (CQRS is a legitimate, separate pattern, not a Onion Architecture requirement). Decided in favor of the plain-class approach: less indirection, easier to trace/test, and it's what the project's own (unenforced) documented convention already said.
- Project check: found two competing conventions — 67 use cases as plain `.run()` classes (orders, establishment, restaurant, billing, most of kitchen-operations) vs 99 use cases wired through `@nestjs/cqrs` Command/QueryHandler triads (crm, hr, iam, inventory, kitchen, menu, procurement, shared-kernel). The project's own `.planning/codebase/CONVENTIONS.md` stated "use `run()`, never `execute()`" — a rule already broken in 8 of 13 bounded contexts. This skill fixes that drift going forward.

## Rule 4 — Cross-bounded-context calls via Port/ACL

- Not a Palermo/Onion-specific rule — this is the Anti-Corruption Layer pattern from DDD strategic design (Eric Evans), a natural extension of the same Dependency Inversion idea applied at the bounded-context boundary instead of the layer boundary.
- Project check: the project has one well-executed example (`orders/order` uses `EstablishmentSettingsPort`, `StationRoutingPort`, `TableLabelPort`, explicitly labeled `// PORTS (ACL)` in `order.module.ts`), but everywhere else — `deduct-ingredients-on-order-closed.ts`, `register-item-reception.ts`, `create-product.ts`, kitchen-printer subscribers — imports another context's domain/application objects directly. This skill generalizes the one correct pattern found and requires it everywhere.

## Rule 5 — Response DTOs live in Application, with `fromAggregate` factory

- Robert C. Martin's boundary-crossing rule: "Typically the data that crosses the boundaries is simple data structures... We don't want to pass Entities or Database rows." This implies the use case itself owns its output contract, not the delivery mechanism.
- Project check: 25 aggregates put response DTOs in `application/dto/`, 11 in `presentation/dto/`, and 6 had both simultaneously for the same feature, with the mapping factory also named inconsistently (`fromAggregate` vs `fromDomain`). No aggregates leaked raw entities to HTTP responses, which is the part that mattered most and was already solid. This skill picks `application/dto/` + `fromAggregate` as the single convention.

## Rule 6 — Request validation stays in Presentation

- Consistent with Microsoft Learn's Application Core/UI Layer type split: validation/framework-decorated request shapes are a UI Layer concern (`class-validator` in this stack), while Application Core stays framework-agnostic.
- Project check: already consistent in the project — no violations found.

## Points intentionally left out of the base skill

- **Exception hierarchy correctness** (`Money`/`Quantity`/`Email`/`Phone` throwing plain `Error` instead of a `DomainException` subclass, breaking the HTTP filter mapping) — this is a project bug, not a general Onion Architecture rule. Candidate content for a future `onion-domain` skill, not the base one.
- **Exact ring count** (3 vs 4 layers) — real, documented disagreement between sources (Code Maze vs Microsoft's diagram). Not arbitrated here since it doesn't change any enforceable rule above; the project's own 4-folder split (domain/application/infrastructure/presentation) is kept as-is.

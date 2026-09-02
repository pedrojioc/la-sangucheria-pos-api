# Rationale — Application layer rules

Sourced justification for each Hard Rule in `SKILL.md`, including a real-world case study from `lasangucheria-pos` on where this pattern was over-applied.

## Rule 1 — One aggregate per use case

Direct consequence of `onion-domain` Rule 4 (one transaction per aggregate, Evans/Vernon). If a use case needs a second aggregate to react, that's exactly what Domain Events exist for — see `onion-domain` Rule 5.

## Rule 2 — Subscribers in Application, reaching other contexts only via Ports

Microsoft Learn: "Handling the domain events is an application concern... the application layer level is where you should have domain event handlers." Combined with the base skill's Port/ACL rule (DDD Anti-Corruption Layer). — [Domain events: Design and implementation](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation)

## Rule 3 — Query Service only when the read shape diverges (CQRS, applied selectively)

**What CQRS actually is**: Command Query Responsibility Segregation — using a different model to update data than the model used to read it. Coined by Greg Young, popularized by Martin Fowler. A "Query Service" is simply this project's name for the read-side half of that principle. — [Fowler: CQRS](https://martinfowler.com/bliki/CQRS.html)

**The lightest tier is still real CQRS**: Microsoft's Azure Architecture Center names "Separate models in a single data store" as *"the foundational level of CQRS"* — same database, distinct read/write models, no event sourcing, no separate stores. This is exactly what `*-query.service.ts` ports implement. — [CQRS Pattern — Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)

**When it's justified, per the same source**: "the read model has no business logic or validation stack. It returns a DTO for use in a view model" — appropriate when the read shape genuinely differs from the write/aggregate shape (lists, filters, projections spanning multiple aggregates). Microsoft explicitly states the pattern **"might not be suitable when: the domain or business rules are simple [or] a simple CRUD-style user interface... is sufficient."**

**When it's NOT justified — the command-bus half, verified against this project**: `lasangucheria-pos` also implemented the write-side of full CQRS (`@nestjs/cqrs` `Command`/`CommandHandler`/bus) in 8 of 13 bounded contexts (99 use cases), while the other 5 contexts (67 use cases) used plain `.run()` classes with no technical criterion distinguishing which got which. Fowler's explicit warning: *"you should be very cautious about using CQRS... for most systems CQRS adds risky complexity"* and *"the majority of cases I've run into have not been so good."* Microsoft's own "when to use this pattern" list (collaborative environments with merge conflicts, task-based UIs needing granular commands, independent read/write scaling, team separation by layer, Event Sourcing integration) — **none of these conditions apply to a single-database project with one team**. The command bus bought two extra files per use case and a dispatch indirection layer, for zero measurable benefit. This is why the base skill (`onion-architecture` Rule 3) rejects the command bus outright, while this skill keeps the Query Service pattern — they are independent halves of CQRS, and only one of them was ever justified here.

**Practical takeaway encoded in the Hard Rule**: apply the read-side pattern only when the read shape actually diverges (the condition that was genuinely met for paginated/filtered lists in this project); don't reach for it as a default for every read, and never pair it with a command bus without one of Microsoft's explicit justifying conditions being true.

## Rule 4 — Single exception hierarchy regardless of folder

Verified against the project's own code: `OrderTypeNotEnabled` lives in `application/exceptions/` but extends `BusinessRuleViolationException` — the same hierarchy defined in `onion-domain`, not a separate `ApplicationException` type. This is a real, consistent pattern already in use; the rule simply documents it so it isn't accidentally reinvented as two taxonomies.

## Rule 5 — Don't duplicate domain validation in the use case

Follows from the Always-Valid Domain Model principle already cited in `onion-domain` Rule 7: "an entity object should not be able to exist without being valid," which means the use case doesn't need to (and shouldn't) re-check what construction/behavior methods on the domain objects already guarantee. — [Always-Valid Domain Model](https://enterprisecraftsmanship.com/posts/always-valid-domain-model/)

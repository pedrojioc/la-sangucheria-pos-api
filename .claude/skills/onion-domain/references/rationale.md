# Rationale — Domain layer rules

Sourced justification for each Hard Rule in `SKILL.md`. Kept out of `SKILL.md` to stay within the skill token budget.

## Rule 1 — Value Objects: immutable, self-validating, no primitive obsession

- Martin Fowler: "Objects that are equal due to the value of their properties... are called value objects." They "lack unique identifiers" and "should be immutable." — [Value Object](https://martinfowler.com/bliki/ValueObject.html)
- Where validation happens (constructor vs. factory) has **no single canonical rule** across Evans/Vernon/Fowler. The invariant that matters is the effect, not the mechanism: "there must be no code path that produces an instance without passing validation." — [Designing validations in the domain model layer (Microsoft Learn)](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations), [Always-Valid Domain Model](https://enterprisecraftsmanship.com/posts/always-valid-domain-model/)
- Primitive obsession (raw `string`/`number` standing in for a domain concept) loses the type's ability to self-validate and carry meaning — Value Objects are the documented DDD remedy. — [Value Object](https://martinfowler.com/bliki/ValueObject.html)
- Project check: `Money`, `Quantity`, `Email`, `Phone` already exist as Value Objects (correct shape) — the bug is that they throw plain `Error` instead of `InvalidValueObjectException` (see Rule 7).

## Rule 2 — No public setters, behavior enforces invariants

- Fowler on the Anemic Domain Model anti-pattern: entities as "bags of getters and setters," logic pushed into services — "if all your logic is in services, you've robbed yourself blind." — [Anemic Domain Model](https://martinfowler.com/bliki/AnemicDomainModel.html)
- If fields are publicly settable, no method boundary exists at which to enforce invariants — "bugs occur because objects are in a state they should never have been in." — [Designing validations in the domain model layer](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations)

## Rule 3 — One Aggregate Root, external code never reaches inside

- Fowler, drawing on Evans: "Any references from outside the aggregate should only go to the aggregate root... the root can thus ensure the integrity of the aggregate as a whole." — [DDD Aggregate](https://www.martinfowler.com/bliki/DDD_Aggregate.html)

## Rule 4 — One transaction per aggregate, events for cross-aggregate consistency

- Evans (DDD book, p.128): "Any rule that spans Aggregates will not be expected to be up-to-date at all times." Evans and Vernon both hold "one transaction = one aggregate," using domain events for consistency between aggregates. — [DDD Aggregate](https://www.martinfowler.com/bliki/DDD_Aggregate.html)
- **Flagged as contested**: Jimmy Bogard has argued same-transaction side effects across aggregates are acceptable in practice. This skill follows the Evans/Vernon default (separate transactions + events) since it's the documented consensus, but it's not unanimous.
- Project check: this is exactly what makes `DeductIngredientsOnOrderClosed` structurally correct as a pattern (event subscriber reacting to another aggregate's change) — its actual problem is a base-skill Rule 4 violation (it imports the other bounded context's domain/application objects directly instead of going through a Port), not a domain-layer violation.

## Rule 5 — Domain Events: past tense, immutable, raised from the root, handled in Application

- "A domain event is something that happened in the domain that you want other parts of the same domain... to be aware of." Past-tense naming: "the class name of the event should be represented as a past-tense verb, like `OrderStartedDomainEvent`." — [Domain events: Design and implementation (Microsoft Learn)](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation)
- "Handling the domain events is an application concern. The domain model layer should only focus on the domain logic... not application infrastructure like handlers and side-effect persistence actions using repositories." — same source.

## Rule 6 — Domain Services are stateless and infra-free

- Evans: when "a significant process or transformation in the domain is not a natural responsibility of an Entity or Value Object," model it as a Service; "services should also be stateless." A *domain* service must not reach into infrastructure — that's an application/infrastructure concern per the base skill's dependency rule.
- Note: this point is paraphrased/derived from Evans ch.7 across secondary summaries; no single fetched primary quote was available, flagged for lower sourcing confidence than the others.

## Rule 7 — Exception taxonomy: two are DDD-grounded, one is a pragmatic convention

- **`InvalidValueObjectException` vs `BusinessRuleViolationException` (real DDD-tactical distinction, at the domain/application seam)**: "Invariant violation (domain rule broken on data that already crossed the boundary)... indicates a bug in the application logic, because when the data enters the domain model boundary, it is assumed to be valid... an entity object should not be able to exist without being valid." — [Always-Valid Domain Model](https://enterprisecraftsmanship.com/posts/always-valid-domain-model/), [Designing validations in the domain model layer](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations)
- **`NotFoundException` — NOT DDD-tactical canon.** Neither Evans nor Vernon names a distinct tactical category for "a referenced thing doesn't exist." DDD literature consistently treats this as a repository/application-layer outcome (repository fails to locate an aggregate by id; the application service decides how to surface that), never as an entity/value-object invariant. This project keeps `NotFoundException` as a `DomainException` subclass for HTTP-status-mapping convenience (404), which is a legitimate pragmatic choice — but it should be understood and documented as an API convention layered on top of DDD, not attributed to Evans/Vernon as if it were domain-tactical doctrine.
- Project check: 75/106 domain exceptions skip the specific subclasses and extend `DomainException` directly, and the four most-used Value Objects (`Money`, `Quantity`, `Email`, `Phone`) throw plain native `Error` — which the registered `DomainExceptionFilter` doesn't catch at all, so these fail as raw unhandled 500s instead of mapped 400s. This is a live bug in `lasangucheria-pos`, not a rule this skill needs to encode differently — it's a cleanup task for that project, separate from this skill.

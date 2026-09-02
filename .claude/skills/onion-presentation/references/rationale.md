# Rationale — Presentation layer rules

Sourced justification for each Hard Rule in `SKILL.md`.

## Rule 1 — Thin controllers, no infrastructure references

Microsoft Learn lists "UI Layer types" explicitly as "Controllers, Filters, Middleware, Views, ViewModels, Startup/composition root" and states: *"No direct instantiation of or static calls to the Infrastructure layer types should be allowed in the UI layer."* — [Common web application architectures](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures), already cited in `onion-architecture`'s rationale.

## Rule 2 — Never import a Domain type into a controller

**Concrete case this generalizes from**: `src/contexts/kitchen/recipe/presentation/http/controllers/recipe.controller.ts` imports `Recipe` (the domain aggregate) solely to type-annotate what `QueryBus.execute()` returns, before mapping it:

```typescript
const recipe: Recipe = await this.queryBus.execute(query)
return RecipeResponse.fromDomain(recipe)
```

This isn't a new bug — it's the visible symptom of an already-diagnosed one: `RecipeResponse` lives in `presentation/http/dto/` instead of `application/dto/` (one of the 11 aggregates with this inconsistency found in the original codebase exploration, already fixed going forward by `onion-architecture` Rule 5). Because the query handler hands back a raw domain object instead of a DTO built in Application, the controller is forced to know about `Recipe` just to receive it. The rule generalizes the lesson: **a controller needing to import a Domain type is itself the signal that the DTO/mapping boundary is misplaced.** The fix is always upstream (Application), never a try/catch or manual mapping added in Presentation.

## Rule 3 — Exactly one exception filter

Verified against the project's actual `main.ts` and filter registration:

```typescript
// main.ts
app.useGlobalFilters(new DomainExceptionFilter())
```

`DomainExceptionFilter` (`@Catch(DomainException)`) correctly maps the three subclasses from `onion-domain` Rule 7 to HTTP statuses: `InvalidValueObjectException` → 400, `BusinessRuleViolationException` → 422 (also the default for any `DomainException` not matching a specific subclass), `NotFoundException` → 404.

**What this rule prevents**: the codebase also contains `src/core/filters/global-exception.filter.ts` (`GlobalExceptionFilter`), which is never registered anywhere — dead code that the project's own `.planning/codebase/CONVENTIONS.md` incorrectly describes as the live one. A second, unregistered filter doesn't just sit there harmlessly — it actively misleads whoever reads the docs or the code next into thinking a different error-handling path is active. This is a project bug to clean up in `lasangucheria-pos` separately, not something this skill needs a special case for — the rule is simply "one filter, registered, and nothing else claiming to be one."

## Rule 4 — Guards/interceptors/pipes are technical decisions, wired at the composition root

Microsoft Learn's "Filters, Middleware" as UI Layer types (same citation as Rule 1) covers the conceptual family Guards belong to (request-pipeline components making a technical decision before/around a controller). Verified in the project: `JwtAuthGuard` is wired once in `main.ts` (`app.useGlobalGuards(new JwtAuthGuard(reflector))`) — a single composition-root registration, consistent with the base skill's composition-root rule (`onion-infrastructure` Rule 4).

**Honest note on file location**: in `lasangucheria-pos`, Guards physically live under `infrastructure/guards/` (e.g. `iam/authentication/infrastructure/guards/jwt-auth.guard.ts`), not under a `presentation/` folder. Neither Evans, Palermo, nor Microsoft's guide takes an explicit position on which folder a NestJS-style Guard belongs in specifically — it's a genuinely ambiguous case (a Guard has one foot in "request-pipeline/delivery mechanism" and one in "technical/cross-cutting concern"), and it doesn't violate the dependency rule wherever it sits. This skill does not mandate moving Guards to `presentation/` — that would be a pure rename with no architectural payoff. The rule only requires that a Guard never contains a business rule, regardless of which folder it's filed under.

## Rule 5 — WebSocket gateways are the same role as controllers

Direct consequence of Cockburn's Hexagonal framing (already used in `onion-architecture`'s rationale): a driving adapter is whatever lets an external actor invoke the application core — HTTP and WebSocket are just two different transports for the identical role. `lasangucheria-pos` already has a real example (`kitchen-operations/agent-gateway`, a `@WebSocketGateway`) confirming this transport exists in the project; this rule ensures it's held to the same thinness standard as HTTP controllers rather than treated as a separate, looser category.

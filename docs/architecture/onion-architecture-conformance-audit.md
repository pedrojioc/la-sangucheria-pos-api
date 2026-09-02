# Onion Architecture Conformance Audit

**Date:** 2026-08-29
**Scope:** Findings from a codebase exploration cross-referenced against the `onion-*` skill set (`.claude/skills/onion-architecture`, `onion-domain`, `onion-application`, `onion-infrastructure`, `onion-presentation`) and primary sources (Palermo, Evans, Vernon, Fowler, Cockburn, Microsoft Learn).
**Status:** Documentation only — nothing in this list has been fixed as part of this audit. Each entry names the skill rule that will guide the fix when this gets picked up as work.

This is a companion to `.planning/codebase/CONCERNS.md` (broader tech-debt/bugs/security audit, 2026-03-17) — this document is narrower and specific to Onion Architecture / DDD conformance.

---

## Remediation plan

Don't fix all 14 findings in one session/PR — they have very different risk and effort. Fix by group, in order, one prompt per session. None of this needs SDD (`/sdd-new`) — the diagnosis is already done here and the reference pattern to copy already exists in the codebase, so there's no open design decision left to make; it's direct correction work.

**Group 1 — mechanical, low risk (do first):** findings #9, #10, #11, #12, #13, #14. Dead code removal, renames, doc fixes. No design judgment needed.

```
Lee docs/architecture/onion-architecture-conformance-audit.md, específicamente
los hallazgos #9, #10, #11, #12, #13 y #14. Antes de tocar código, cargá
completas las skills onion-domain, onion-infrastructure y onion-presentation
(.claude/skills/) junto con sus references/rationale.md.

Corregí cada hallazgo exactamente como indica la skill correspondiente:
- Borrá el GlobalExceptionFilter muerto y corregí CONVENTIONS.md
- Borrá el CommandBus port/adapter sin uso
- Borrá REPOSITORY_TOKENS sin uso
- Migrá ProductCategoryRepository y UnitRepository al patrón abstract class
- Renombrá los 10 archivos de excepción sin sufijo .exception.ts
- Corregí las inexactitudes de CONVENTIONS.md

No toques nada de los hallazgos #1-8 en esta sesión. Un commit por hallazgo.
Corré los tests después de cada cambio.
```

**Group 2 — medium risk, contained blast radius:** findings #7, #8, #6. Follow a mechanical pattern already defined in the skills, but touch more files — do each as its own session.

**Group 3 — cross-context ports, one finding per session:** findings #1, #2, #3, #4. The port shape to copy already exists (`EstablishmentSettingsPort`/`TypeOrmEstablishmentSettingsAdapter` in `orders/order`) — this is direct correction, not new design.

```
Lee el hallazgo #2 de docs/architecture/onion-architecture-conformance-audit.md
(register-item-reception.ts). Cargá completas las skills onion-architecture y
onion-infrastructure (.claude/skills/), incluyendo references/rationale.md,
antes de tocar código.

Diseñá el/los puerto(s) necesarios en application/ports/ de
procurement/purchase-order y sus adapters en infrastructure/adapters/,
usando EstablishmentSettingsPort/TypeOrmEstablishmentSettingsAdapter
(orders/order) como referencia exacta de la forma correcta.

No toques ningún otro hallazgo en esta sesión.
```

**Group 4 — CQRS bus migration, one bounded context per session:** finding #5 (99 use cases across 8 contexts). Same direct-correction logic, just large — split by context so each session/PR stays reviewable.

```
Lee el hallazgo #5 de docs/architecture/onion-architecture-conformance-audit.md.
Cargá completa la skill onion-architecture (.claude/skills/), incluyendo
references/rationale.md.

Migrá los casos de uso del contexto `crm` de Command/CommandHandler/bus
(@nestjs/cqrs) a clases planas con .run(), siguiendo el patrón ya usado en
`orders` como referencia. No toques ningún otro contexto en esta sesión.
Corré los tests después de cada caso de uso migrado.
```

Repetir cambiando `crm` por el siguiente contexto en cada sesión sucesiva.

---

## Summary

| # | Finding | Severity | Category | Governing rule |
|---|---|---|---|---|
| 1 | `deduct-ingredients-on-order-closed.ts` imports `menu`/`inventory` domain+application directly, no port | High | Cross-context | `onion-architecture` Rule 4 |
| 2 | `register-item-reception.ts` imports `inventory`+`shared-kernel` domain directly (3 contexts, no port) | High | Cross-context | `onion-architecture` Rule 4 |
| 3 | Kitchen-printer subscribers import `orders` domain directly | Medium | Cross-context | `onion-architecture` Rule 4 |
| 4 | `create-product.ts` calls sibling use cases directly, no port | Low | Cross-context | `onion-architecture` Rule 4 |
| 5 | Two competing use-case orchestration styles (plain `.run()` vs `@nestjs/cqrs` bus) across contexts | High | Application | `onion-architecture` Rule 3 |
| 6 | Response DTO location split between `application/dto/` and `presentation/dto/` | Medium | Application/Presentation | `onion-architecture` Rule 5 |
| 7 | `Money`/`Quantity`/`Email`/`Phone` throw plain `Error`, bypassing the exception filter | High | Domain | `onion-domain` Rule 7 |
| 8 | 75/106 domain exceptions extend `DomainException` directly instead of a specific subclass | Medium | Domain | `onion-domain` Rule 7 |
| 9 | Dead `GlobalExceptionFilter`, never registered, but documented as live | Medium | Presentation | `onion-presentation` Rule 3 |
| 10 | Dead `CommandBus` port/adapter, built then bypassed by 131 files | Low | Infrastructure | `onion-application` Rule 3 (rationale) |
| 11 | Dead `REPOSITORY_TOKENS` Symbol map, unused | Low | Infrastructure | `onion-domain` Rule 2 (rationale) |
| 12 | 2/39 repositories use `interface`+`Symbol` instead of `abstract class` | Low | Infrastructure | `onion-domain` Rule 2 |
| 13 | 10/106 domain exception files missing `.exception.ts` suffix | Low | Domain | `onion-domain` Rule 7 |
| 14 | `.planning/codebase/CONVENTIONS.md` itself is stale/inaccurate on ≥2 points | Low | Docs | — |

---

## A. Cross-bounded-context boundary violations

### 1. `deduct-ingredients-on-order-closed.ts` — High

**File:** `src/contexts/orders/order/application/subscribers/deduct-ingredients-on-order-closed.ts`

```typescript
import { ProductRepository } from '@contexts/menu/product/domain/repositories/product.repository'
import { ProductId } from '@contexts/menu/product/domain/product-id'
import { ProductRecipeRepository } from '@contexts/menu/product-recipe/domain/repositories/product-recipe.repository'
import { DeductIngredient } from '@contexts/inventory/stock-level/application/deduct/deduct-ingredient'
```

Imports two `menu` domain repositories and one `inventory` use case directly into an `orders` Application subscriber. No port exists for this. This is the same module (`order.module.ts`) that also contains the one correct example in the codebase (`EstablishmentSettingsPort`/`TypeOrmEstablishmentSettingsAdapter`) — the pattern to fix toward already exists a few lines away.

**Fix direction:** define a port in `orders/order/application/ports/` (e.g. `InventoryDeductionPort`) covering what this subscriber needs, implement the adapter in `orders/order/infrastructure/adapters/` calling `menu`'s and `inventory`'s public use cases — never their domain repositories.

### 2. `register-item-reception.ts` — High

**File:** `src/contexts/procurement/purchase-order/application/register-item-reception/register-item-reception.ts`

```typescript
import { IngredientRepository } from '@contexts/inventory/ingredient/domain/repositories/ingredient.repository'
import { IngredientId } from '@contexts/inventory/ingredient/domain/ingredient-id'
import { UnitConversionRepository } from '@contexts/shared-kernel/unit-conversion/domain/repositories/unit-conversion.repository'
import { UnitConversionNotFound } from '@contexts/shared-kernel/unit-conversion/domain/exceptions/unit-conversion-not-found.exception'
import { InventoryBatch } from '@contexts/inventory/batch/domain/inventory-batch'
import { InventoryMovement } from '@contexts/inventory/stock-level/domain/inventory-movement'
import { InventoryLevel } from '@contexts/inventory/stock-level/domain/inventory-level'
import { MovementType } from '@contexts/inventory/stock-level/domain/movement-type'
```

The most severe instance found: **8 domain objects imported directly from 2 other bounded contexts** (`inventory`, `shared-kernel`), no port at all. `procurement` has zero abstraction over its dependency on `inventory`'s internals — a change to any of `IngredientRepository`, `InventoryBatch`, `InventoryMovement`, `InventoryLevel`, or `MovementType` breaks this use case directly.

**Fix direction:** this one needs more than a single port — it likely needs a small set of them (e.g. an `InventoryReceptionPort` covering ingredient lookup + batch/movement recording, a `UnitConversionPort` for the conversion lookup), implemented by adapters in `procurement/purchase-order/infrastructure/adapters/` that call `inventory`'s and `shared-kernel`'s public use cases.

### 3. Kitchen-printer subscribers — Medium

**Files:** `src/contexts/kitchen-operations/kitchen-printer/application/kitchen-print-ticket.ts`, `.../subscribers/print-kitchen-ticket-on-order-sent.ts`

Import `OrderType`/`OrderSentToKitchenEvent` straight from `orders/order/domain`. Same category of violation as #1/#2, smaller blast radius (read-only event data, not repositories).

### 4. `create-product.ts` — Low

**File:** `src/contexts/menu/product/application/create/create-product.ts`

Directly imports and invokes `FindProductCategory` (sibling aggregate in the same `menu` context — acceptable per `onion-architecture`'s decision gate "same context, no port required") and `FindIngredient` (a use case in `inventory` — cross-context, no port). Less severe than #1/#2 because it calls a use case (Application entry point), not a domain repository — but still missing the port abstraction the base skill requires.

---

## B. Application-layer orchestration inconsistency — High

**Files:** all use cases under `orders`, `establishment`, `restaurant`, `billing`, most of `kitchen-operations` (67 files, plain `.run()`) vs. `crm`, `hr`, `iam`, `inventory`, `kitchen`, `menu`, `procurement`, `shared-kernel` (99 files, `@nestjs/cqrs` Command/QueryHandler triads).

No technical criterion separates which contexts got which pattern. Confirmed (with the project owner's own assessment) that the command-bus half was over-engineering: single datastore, no need for independent read/write scaling, no distributed team — none of the conditions that justify CQRS's write-side machinery apply here. `onion-architecture` Rule 3 fixes this going forward (plain `.run()`, no bus) for new code; migrating the 99 existing files is a separate, larger effort.

Related dead abstraction: `src/shared/application/bus/command-bus.ts` + `src/shared/infrastructure/cqrs/nest-command-bus-adapter.ts` implement a framework-decoupling port for the command bus that has **zero consumers** — 131 files import `@nestjs/cqrs` directly instead. See finding #10.

---

## C. Response DTO location inconsistency — Medium

25 aggregates put response DTOs in `application/dto/*.response.ts`; 11 put them in `presentation/*/dto/*.response.ts` instead (billing, kitchen/recipe, kitchen/transformation, menu/product-option, and others); 6 aggregates have both for different endpoints of the same feature. Mapper factory also named inconsistently: `fromAggregate` (orders) vs `fromDomain` (kitchen/recipe and others).

**Concrete symptom:** `src/contexts/kitchen/recipe/presentation/http/controllers/recipe.controller.ts` has to import the `Recipe` domain aggregate directly just to type-annotate what the query bus hands back before mapping it — because `RecipeResponse` lives in `presentation/dto/`, not `application/dto/`. This is exactly the case `onion-presentation` Rule 2 is written against.

No aggregate was found leaking a raw domain entity directly to an HTTP response (every controller checked wraps through a `*Response` DTO) — that part is solid across the codebase.

---

## D. Domain exception hierarchy — High + Medium

### 7. Value Objects throwing plain `Error` — High

**Files:** `src/shared/domain/value-objects/money.ts`, `quantity.ts`, `email.ts`, `phone.ts`

These four Value Objects — among the most-used in the codebase — throw native `Error` instead of `InvalidValueObjectException`. Since `main.ts` only registers `DomainExceptionFilter` (`@Catch(DomainException)`), these errors are **not caught by any filter** and fall through to NestJS's default handler as raw, unmapped 500s instead of clean 400s. Sibling VOs in the same folder (`boolean.ts`, `value-object.ts`, `uuid.ts`) throw correctly.

**Why this matters more than a typical bug:** this breaks the exact contract `onion-domain` Rule 7 and `onion-presentation` Rule 3 depend on — the whole exception-to-HTTP-status mapping assumes every domain-originated error extends `DomainException`.

### 8. Exception subclass usage — Medium

75/106 domain exceptions extend `DomainException` directly (skipping the specific subclasses that drive HTTP mapping), 22 extend `BusinessRuleViolationException`, 7 extend `NotFoundException`, **0 extend `InvalidValueObjectException`** despite it existing specifically for that purpose, and 2 (`ingredient-category-not-exist.ts`, `ingredient-category-description-too-long.ts`) extend `Error` directly.

---

## E. Presentation — dead exception filter — Medium

**Files:** `src/core/filters/global-exception.filter.ts` (dead), `src/core/filters/domain-exception.filter.ts` (live, registered in `main.ts:36`)

`GlobalExceptionFilter` is never registered anywhere in the app, yet `.planning/codebase/CONVENTIONS.md:117-121` describes it as the live global handler. Anyone reading that doc instead of the code will misunderstand how errors are actually handled.

---

## F. Dead/abandoned abstractions — Low

- **`src/shared/application/bus/command-bus.ts`** + **`src/shared/infrastructure/cqrs/nest-command-bus-adapter.ts`**: a correctly-designed framework-decoupling port for the command bus, built and never adopted (0 consumers; see finding #5).
- **`src/shared/domain/constants/repository-tokens.ts`**: a `REPOSITORY_TOKENS` Symbol map for repository DI tokens, superseded by the abstract-class-as-token pattern (`onion-domain` Rule 2), never removed. Zero references anywhere.

## G. Minor naming inconsistencies — Low

- **Repository port mechanism**: `ProductCategoryRepository` (menu) and `UnitRepository` (shared-kernel) use a plain `interface` + same-named `Symbol` instead of the `abstract class` pattern used by the other 37 repositories.
- **Exception file suffix**: 10/106 domain exception files are missing the `.exception.ts` suffix (`ingredient-category-not-exist.ts`, `ingredient-not-exist.ts`, `product-not-exist.ts`, `product-sku-already-exists.ts`, `ingredients-not-found.ts`, `invalid-unit-type.ts`, `unit-name-too-long.ts`, `unit-not-exist.ts`, `unit-symbol-too-long.ts`, `ingredient-category-description-too-long.ts` — all under `inventory`, `menu`, `procurement`, `shared-kernel` domain/exceptions folders).
- **`.planning/codebase/CONVENTIONS.md`** itself is stale on at least two points beyond the exception filter (finding #9): it claims `use run(), never execute()` as an enforced rule when 99 files already violate it (finding #5), and cites `StringValueObject` at a path (`@/shared/domain/value-objects/string-value-object.ts`) that doesn't match the actual file (`string.ts`).

---

## What's already solid (for contrast, not action items)

- Domain has zero outward dependencies anywhere — verified empirically across the whole `domain/` tree.
- No aggregate leaks directly to an HTTP response — always wrapped in a Response DTO.
- `docs/architecture/CQRS-READ-MODELS-STRATEGY.md` (2026-01-22) had already reasoned through the multi-aggregate read problem and chosen "Option A: Separate Read Repository" — this independently arrived at the same shape `onion-application` Rule 3 formalizes (Query Service in Application, distinct from the write repository in Domain). The two documents agree.

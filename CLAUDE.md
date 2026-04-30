# CLAUDE.md

Guidance for Claude Code when working with this codebase.

## Project Overview

**Project:** La Sanguchería POS — Restaurant Point of Sale System
**Stack:** NestJS 11, TypeScript 5.7, TypeORM 0.3, PostgreSQL
**Architecture:** Onion Architecture + DDD (CodelyTV pragmatic style)
**Package manager:** pnpm

---

## Architecture

### Layers (dependency rule: always inward)

```
Presentation  →  Application  →  Domain  ←  Infrastructure
(HTTP/DTOs)      (Use Cases)    (Pure TS)   (TypeORM, EventBus)
```

- **Domain:** 100% pure TypeScript. No decorators, no framework imports.
- **Application:** Use cases (pure classes) + CQRS handlers (adapters).
- **Infrastructure:** TypeORM entities, repository implementations, event bus.
- **Presentation:** Controllers, request/response DTOs.

### Module structure

```
src/contexts/{context}/{module}/
  domain/           # Aggregate, VOs, events, exceptions, repository interface
  application/      # Use cases, commands/queries, handlers, subscribers
  infrastructure/   # TypeORM entity, repository impl, query services
  presentation/     # Controller, DTOs
```

Reference module: `src/contexts/inventory/ingredient-category/`

---

## Key Conventions

### 1. Use Cases

- Class name: action + entity, **no suffix** → `CreateProduct`, `FindProduct`, `SearchProductsByCriteria`
- File name: kebab-case → `create-product.ts`
- Method: **`run()`** always (never `execute()` — that's for handlers only)
- Pure class: no `@Injectable()`, no `@Inject()`

```typescript
export class CreateIngredientCategory {
  constructor(
    private readonly repository: IngredientCategoryRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string, name: string, ...): Promise<void> {
    const entity = IngredientCategory.create(id, name, ...)
    await this.repository.save(entity)
    await this.eventBus.publish(entity.pullDomainEvents())
  }
}
```

### 2. CQRS — only when it adds value

Use Command/Query/Handler only when:
- Multiple entry points invoke the same use case (HTTP + events + CLI)
- You need bus middleware (logging, transactions)
- Async/background execution

For simple HTTP-only flows, the controller can call the use case directly.

### 3. Module registration — always `createProvider`

Use cases are registered with `createProvider` (from `@/core/utils/create-provider`) to keep them framework-agnostic:

```typescript
createProvider(CreateIngredientCategory, [IngredientCategoryRepository, EventBus])
```

Repositories use `useClass`, services use `useClass` or `useExisting`.

### 4. Repository interfaces — abstract class in domain

```typescript
// domain/repositories/ingredient-category.repository.ts
export abstract class IngredientCategoryRepository {
  abstract save(entity: IngredientCategory): Promise<void>
  abstract search(id: IngredientCategoryId): Promise<IngredientCategory | null>
  abstract searchAll(): Promise<IngredientCategory[]>
  // Add matching(criteria) only when Criteria pattern is needed
}
```

### 5. Value Objects

- Flat in `domain/` alongside the aggregate (no `value-objects/` subdir)
- File: `product-name.ts` → class `ProductName extends StringValueObject`
- No `.vo.ts` suffix

### 6. Exceptions

- File: `kebab-case.exception.ts`
- Class extends `DomainException` (not `Error`)
- Location: `domain/exceptions/`

```typescript
export class IngredientCategoryNotExist extends DomainException {
  constructor(id: string) {
    super(`Ingredient category with id ${id} does not exist`)
  }
}
```

### 7. IDs — always from the frontend

POST endpoints receive `id` in the request body. The backend never generates IDs for user-initiated resources.

### 8. Criteria pattern — only for large datasets

Use `matching(criteria: Criteria): Promise<PaginatedResult<T>>` when:
- Expected records > 100
- Complex filters or dynamic sorting needed

Domain uses `pageSize` (never `limit`). Infrastructure translates to SQL `LIMIT`.

**Don't use** for small catalogs (categories, units, ~20 records).

### 9. Domain Events

```typescript
// Aggregate records event
const entity = IngredientCategory.create(...)  // records event internally

// Use case publishes after save
await this.repository.save(entity)
await this.eventBus.publish(entity.pullDomainEvents())
```

### 10. Migrations — auto-generate with TypeORM CLI

```bash
name=DescriptiveName pnpm migration:generate   # after modifying entity
pnpm migration:run
```

Manual migrations only for seed data or data transformations TypeORM can't infer.

---

## Project Structure (actual)

```
src/
  contexts/
    inventory/
      ingredient-category/   # reference module
      ingredient/
      batch/
      stock-level/
    menu/
      product/
      product-category/
    procurement/
      purchase-order/
      supplier/
    kitchen/
      recipe/
      transformation/
    shared-kernel/
      unit/
      unit-conversion/
    iam/
      user/
      authentication/
  shared/
    domain/
      criteria/              # Criteria, Filter, Filters, Order, PaginatedResult
      value-objects/         # Uuid, StringValueObject, Quantity, etc.
      events/                # EventBus abstract class
      exceptions/            # DomainException, ApplicationException
    infrastructure/
      event-bus/
      event-sourcing/        # EventStore
      database/
        typeorm/
          migrations/
        seeders/
  core/
    filters/                 # GlobalExceptionFilter
    utils/                   # createProvider
  main.ts

tests/
  contexts/
    {context}/{module}/
      __mothers__/           # Object Mother factories
      application/
```

---

## Commands

```bash
pnpm start:dev
pnpm test / pnpm test:watch / pnpm test:cov
pnpm lint / pnpm format
name=X pnpm migration:generate
pnpm migration:run / pnpm migration:revert
pnpm seed:run / pnpm db:reset
```

## Path Aliases

- `@/*` → `src/*`
- `@shared/*` → `src/shared/*`
- `@contexts/*` → `src/contexts/*`
- `@core/*` → `src/core/*`
- `@test/*` → `tests/*`

---

## Critical Rules

| DO | DON'T |
|----|-------|
| Domain layer 100% pure | `@Injectable()` on use cases |
| Use `abstract class` for repositories | Mix TypeORM `@Entity` with domain aggregates |
| `createProvider` for use case injection | Generate IDs in the backend |
| `run()` on use cases | `execute()` on use cases |
| `pageSize` in domain | `limit` in domain |
| `.exception.ts` extending `DomainException` | Extend `Error` directly for business exceptions |
| Auto-generate migrations | Write migrations manually for schema changes |
| Object Mothers in tests | Framework decorators in domain layer |

---

## Testing

- Object Mother pattern for test factories (`__mothers__/`)
- No database in unit tests (mock repositories)
- AAA structure (Arrange, Act, Assert)

---

## SDD Orchestrator

- Persistence: `engram` (default when available)
- `/sdd-init` `/sdd-explore` `/sdd-new` `/sdd-ff` `/sdd-apply` `/sdd-verify` `/sdd-archive`
- Convention files: `~/.claude/skills/_shared/`

**Last Updated:** 2026-03-07 | **Version:** 2.0.0

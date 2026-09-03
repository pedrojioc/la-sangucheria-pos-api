# Coding Conventions

**Analysis Date:** 2026-03-17

## Naming Patterns

**Files:**
- Use kebab-case for all files: `create-ingredient-category.ts`, `ingredient-category.repository.ts`
- DTOs: `create-ingredient-category.dto.ts`, `ingredient-category.response.ts`
- Exceptions: `invalid-status-transition.exception.ts`
- Event classes: `ingredient-category-created.event.ts`
- Test files: `PurchaseOrder.spec.ts` (PascalCase for test names)
- Test helpers: `PurchaseOrderMother.ts`, `UuidMother.ts` (PascalCase for Mother classes)

**Functions:**
- Use camelCase for all functions and methods
- Use `run()` method for use cases (never `execute()` or `handle()`) — this is the target convention for new code; see `docs/architecture/onion-architecture-conformance-audit.md` finding #5 for the ~99 existing files still on the `@nestjs/cqrs` Command/QueryHandler pattern, migrated context-by-context
- Factory methods: `create()`, `fromPrimitives()`, `random()` (for test mothers)
- Getter/Builder methods: `static random()`, `static create()`, `static inDraft()` (see `PurchaseOrderMother`)

**Variables:**
- Use camelCase for all variables, parameters, and properties
- Use descriptive names: `purchaseOrderRepository` not `repo`
- Private fields: `private readonly fieldName` (always readonly unless explicitly mutable)
- Constructor parameters match field names exactly for clarity

**Types:**
- PascalCase for all classes, interfaces, and types
- Aggregate roots: `PurchaseOrder`, `IngredientCategory`, `Product`
- Value Objects: `PurchaseOrderId`, `PurchaseOrderNumber`, `IngredientCategoryName`
- Interfaces for primitives: `PurchaseOrderPrimitives`, `IngredientCategoryPrimitives`
- Exceptions: `InvalidStatusTransition`, `PurchaseOrderHasNoItems`
- Services: `PurchaseOrderValidationService`
- Repositories: `PurchaseOrderRepository` (abstract), `TypeOrmPurchaseOrderRepository` (impl)

## Code Style

**Formatting:**
- Prettier v3.4.2 configured in `.prettierrc`
- Semi-colons: disabled (false)
- Single quotes: enabled
- Trailing commas: disabled (none)
- Tab width: 2 spaces
- Print width: 100 characters
- Arrow function parens: avoid (`x => x` not `(x) => x`)
- Bracket spacing: enabled (`{ x }` not `{x}`)

**Linting:**
- ESLint 9.18.0 with TypeScript ESLint 8.41.0 via `eslint.config.mjs`
- Config format: ES Modules (not .eslintrc.json)

**Run commands:**
```bash
pnpm lint              # Check lint issues and fix
pnpm lint:check        # Check only (no fixes)
pnpm format            # Format with Prettier
pnpm format:check      # Check formatting only
```

## Import Organization

**Order:**
1. External libraries (`@nestjs/*`, `typeorm`, `uuid`, etc.)
2. Shared domain imports (`@/shared/domain/*`, `@/shared/infrastructure/*`)
3. Local context imports (same context, relative paths or `@contexts/*`)
4. Local module imports (relative paths within module)

**Path Aliases:**
- `@/*` → `src/*` (any src file)
- `@shared/*` → `src/shared/*` (shared infrastructure/domain)
- `@contexts/*` → `src/contexts/*` (bounded context)
- `@shared-kernel/*` → `src/contexts/shared-kernel/*` (cross-context)
- `@core/*` → `src/core/*` (filters, utilities)
- `@test/*` → `tests/*` (test files)

**Example (from `CreatePurchaseOrder`):**
```typescript
import { EventBus } from '@/shared/domain/events'
import { PurchaseOrder } from '../../domain/purchase-order'
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository'
import { PurchaseOrderValidationService } from '../../domain/services/purchase-order-validation.service'
import { PurchaseOrderNumber } from '../../domain/purchase-order-number'
```

## Error Handling

**Strategy:** Domain exceptions for business rule violations, standard Error for validation/infrastructure errors.

**Patterns:**

1. **Domain Exceptions** - Extend `DomainException` for business logic errors:
```typescript
import { DomainException } from '@/shared/domain/exceptions/domain.exception'

export class InvalidStatusTransition extends DomainException {
  constructor(from: PurchaseOrderStatus, to: PurchaseOrderStatus) {
    super(`Cannot transition purchase order from ${from} to ${to}. Invalid status transition.`)
  }
}
```

2. **Throwing exceptions in domain layer:**
```typescript
if (!this.isValidTransition(newStatus)) {
  throw new InvalidStatusTransition(this.status, newStatus)
}
```

3. **Validation in application use cases:**
```typescript
// Use domain validation service
await this.validationService.validateIngredientsExists(
  orderItems.map(item => item.ingredientId)
)
```

4. **Global exception handling** - `DomainExceptionFilter` in `src/core/filters/domain-exception.filter.ts` is the single registered filter (`app.useGlobalFilters(new DomainExceptionFilter())` in `main.ts`), mapping the `DomainException` hierarchy to HTTP status codes:
- `InvalidValueObjectException` → 400
- `BusinessRuleViolationException` → 422 (also the default for any unmatched `DomainException`)
- `NotFoundException` → 404

## Logging

**Framework:** NestJS `Logger` from `@nestjs/common`

**Location:** Infrastructure and presentation layers only (never domain layer)

**Pattern (in services and filters):**
```typescript
import { Logger } from '@nestjs/common'

export class SomeService {
  private readonly logger = new Logger(SomeService.name)

  async someMethod() {
    this.logger.error(`Error occurred`, { context: 'details' })
  }
}
```

**Current logging usage:**
- Console.log/warn used in event subscribers and seeds (temporary/development)
- Proper Logger used in exception filters and storage services
- **Convention:** Use NestJS Logger for production code, console is acceptable in subscribers during development

## Comments

**When to Comment:**
- Use case class header: Document use case purpose, business rules, and events
- Complex domain logic: Explain non-obvious validations or state transitions
- Workarounds/TODO items: Document known gaps or incomplete implementations
- Infrastructure implementation details: Clarify responsibility boundaries between repository and query service

**JSDoc/TSDoc:**
- Use for public use cases and main domain aggregates
- Format:
```typescript
/**
 * CreatePurchaseOrder - Use Case
 *
 * Creates a new purchase order in DRAFT status with initial items.
 *
 * Business Rules:
 * - Order is created in DRAFT status with at least one item
 * - Order can be modified while in DRAFT
 * - Order number is generated automatically by the system (PO-YYYY-NNN)
 * - All items must use the same currency as the order
 *
 * Domain Events:
 * - PurchaseOrderCreatedEvent
 */
export class CreatePurchaseOrder { ... }
```

- Infrastructure service documentation:
```typescript
/**
 * TypeOrmPurchaseOrderRepository - Infrastructure Implementation (WRITE Operations)
 *
 * Implementación de persistencia usando TypeORM para Purchase Orders.
 * Este repositorio se enfoca en operaciones de ESCRITURA y búsquedas
 * necesarias para comandos.
 *
 * Para operaciones de LECTURA complejas (listados con paginación, filtros,
 * búsqueda por supplierName), usar TypeOrmPurchaseOrderQueryService.
 */
```

**Inline comments:**
- Use for workflow steps: `// 1. Validate ingredients`, `// 2. Generate order number`
- Never duplicate what code already says

## Function Design

**Size:**
- Use cases: typically 10–40 lines (see `CreatePurchaseOrder` at 74 lines with full JSDoc is acceptable)
- Methods: keep under 50 lines; extract complex workflows into separate helpers
- Aggregates: domain methods can be longer if they're cohesive (e.g., `PurchaseOrder` is 785 lines but methods are focused)

**Parameters:**
- Use case `run()` accepts primitives (string, number, Date, null) and simple objects, not domain entities
- Aggregates `create()` accepts primitives, factories convert from use case parameters
- Services: inject dependencies as constructor parameters, never as method parameters

**Return Values:**
- Use cases: always async, return `Promise<void>` (domain events are published separately)
- Aggregates: return new instance (immutable pattern) or void (mutable aggregate)
- Factory methods: return the constructed instance
- Repositories: return domain entities or null, never database entities

## Module Design

**Exports:**
- Module file: export `@Module()` decorated class
- Feature exports: typically just the module is exported
- Public API: use barrel files only for test mothers and shared utilities

**Barrel Files:**
- Location: `tests/**/__mothers__/` for test factories
- Export pattern: `export { UuidMother }` from individual files combined in index if needed
- Avoid barrel files in src/ (import directly from module paths for clarity)

**Example aggregate export:**
```typescript
// src/contexts/procurement/purchase-order/domain/purchase-order.ts
export class PurchaseOrder { ... }
export interface PurchaseOrderPrimitives { ... }
```

**Repository interface location:**
- Defined in `domain/repositories/` as abstract class
- Implementation in `infrastructure/persistence/typeorm/typeorm-{name}.repository.ts`
- Example: `src/contexts/procurement/purchase-order/domain/repositories/purchase-order.repository.ts`

## Value Objects

**Pattern:**
- String value objects extend `StringValueObject` from `@/shared/domain/value-objects/string.ts`
- All value objects are immutable (constructor only, no setters)
- Include validation in constructor (throw `InvalidValueObjectException` or specific domain exception)
- Expose value via `value` property
- Optional: `equals()`, `toString()` methods for comparison

**Example:**
```typescript
export class PurchaseOrderId extends Uuid {}  // Inherits from Uuid VO

export class Username extends StringValueObject {
  // Inherits validation from StringValueObject parent
}
```

**Location:** Defined in `domain/` alongside aggregate root, not in separate `value-objects/` subdirectory

## Primitives Pattern

**Purpose:** Convert between domain entities and DTOs/database entities

**Interface definition (in domain):**
```typescript
export interface PurchaseOrderPrimitives {
  id: string
  orderNumber: string
  supplierId: string
  status: PurchaseOrderStatus
  items: PurchaseOrderItemPrimitives[]
  // ... other fields
}
```

**Factory methods on aggregates:**
```typescript
static fromPrimitives(primitives: PurchaseOrderPrimitives): PurchaseOrder {
  return new PurchaseOrder(...)
}

toPrimitives(): PurchaseOrderPrimitives {
  return { id: this.id.value, ... }
}
```

**Usage:**
- Converting from HTTP DTO → use case → domain entity
- Converting domain entity → response DTO
- Persisting/loading from database

---

*Convention analysis: 2026-03-17*

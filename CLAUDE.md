# CLAUDE.md

This file provides comprehensive guidance to Claude Code when working with this codebase.

## 🎯 Project Overview

**Project:** La Sanguchería POS (Point of Sale System)
**Type:** Restaurant Point of Sale Management System
**Stack:** NestJS, TypeScript, TypeORM, PostgreSQL
**Architecture:** Onion Architecture + Domain-Driven Design (DDD)
**Style Reference:** CodelyTV (pragmatic DDD)
**Status:** Active Development - Base Implementation Phase

This is a Point of Sale system for a fast-food restaurant chain specializing in sandwiches. The project is establishing architectural standards and patterns that will guide the entire system development.

---

## 🏗️ Architecture Philosophy

### Core Principles

#### 1. **Onion Architecture (Layered Design)**

The application follows strict layered architecture with the **Dependency Rule**: dependencies always point inward toward the domain.

```
┌─────────────────────────────────────┐
│     Presentation Layer (HTTP)       │  ← Controllers, DTOs, Validators
├─────────────────────────────────────┤
│   Infrastructure Layer (Adapters)   │  ← TypeORM, EventBus, External Services
├─────────────────────────────────────┤
│   Application Layer (Use Cases)     │  ← Commands, Queries, Handlers
├─────────────────────────────────────┤
│      Domain Layer (Pure Logic)      │  ← Aggregates, Entities, Value Objects
└─────────────────────────────────────┘
```

**Layer Rules:**
- **Domain Layer:** 100% pure TypeScript, NO external dependencies, NO decorators
- **Application Layer:** Orchestrates use cases, 95% pure (minimal decorators)
- **Infrastructure Layer:** Implements domain interfaces, uses frameworks
- **Presentation Layer:** HTTP/WebSocket interfaces, validation, DTOs

#### 2. **Domain-Driven Design (DDD)**

- **Aggregates:** Cluster of domain objects treated as a single unit
- **Entities:** Objects with identity that persist over time
- **Value Objects:** Immutable objects defined by their attributes
- **Domain Events:** Things that happened in the domain
- **Repositories:** Abstraction for persistence (interface in domain, impl in infra)
- **Bounded Contexts:** Each module represents a bounded context
- **Ubiquitous Language:** Consistent terminology across code and domain

#### 3. **CQRS (Command Query Responsibility Segregation)**

- **Commands:** Write operations (create, update, delete)
- **Queries:** Read operations (find, list, search)
- **Handlers:** Separate handlers for commands and queries
- Uses `@nestjs/cqrs` as infrastructure adapter

#### 4. **CodelyTV Style**

- Pragmatism over architectural purity
- Clean, SOLID, testable code
- Clear separation of concerns
- Balance between architectural purity and productivity
- Prefer simple solutions over complex abstractions

#### 5. **ID Generation Strategy**

**⚠️ CRITICAL RULE: Frontend-Generated IDs**

- **IDs are ALWAYS generated in the frontend** for resources created through direct user interaction
- The backend **NEVER** generates IDs for create operations initiated by users
- IDs are received as part of the request body, just like any other field
- This applies to all POST endpoints that create new resources

**Why this approach:**
- **Client-side optimistic updates:** UI can immediately show the new resource
- **Offline-first capability:** Resources can be created offline and synced later
- **Idempotency:** Retrying the same request won't create duplicates
- **Event sourcing ready:** Consistent with event-driven architectures

**Example - ✅ CORRECT:**

```typescript
// Request DTO
export class CreateUnitRequest {
  @IsUUID()
  @IsNotEmpty()
  id: string  // ← ID comes from frontend

  @IsString()
  @IsNotEmpty()
  name: string

  // ... other fields
}

// Controller
@Post()
async create(@Body() dto: CreateUnitRequest): Promise<void> {
  const command = new CreateUnitCommand(
    dto.id,  // ← Use ID from request
    dto.name,
    // ...
  )
  await this.commandBus.execute(command)
}
```

**Example - ❌ INCORRECT:**

```typescript
// ❌ DON'T generate ID in backend
@Post()
async create(@Body() dto: CreateUnitRequest): Promise<void> {
  const id = uuid()  // ❌ WRONG!
  const command = new CreateUnitCommand(id, dto.name, ...)
  await this.commandBus.execute(command)
}
```

**Exceptions:**
- System-generated resources (background jobs, system events)
- Internal events or audit logs
- Resources not directly created by user actions

#### 6. **Exception Naming Convention**

**⚠️ CRITICAL RULE: Exceptions vs Errors**

**Understanding the difference:**

| Concept | Purpose | Recoverability | Usage |
|---------|---------|----------------|-------|
| **Exception** | Business/Domain condition | ✅ Recoverable | Expected flow |
| **Error** | System/Programming problem | ❌ Not recoverable | Unexpected issue |

**In DDD Context:**
- Domain Exceptions represent **violated business rules** (expected and handleable)
- Errors represent **system failures** (unexpected, requires intervention)

**Naming Convention:**

```typescript
// ✅ CORRECT - Exception (business rule violation)
export class UnitNameTooLong extends DomainException {
  constructor() {
    super('Unit name cannot exceed 50 characters')
  }
}
// File: unit-name-too-long.exception.ts

// ✅ CORRECT - Exception (entity not found)
export class ProductCategoryNotFound extends DomainException {
  constructor(id: string) {
    super(`Product category with id ${id} does not exist`)
  }
}
// File: product-category-not-found.exception.ts

// ❌ INCORRECT - Error (reserved for system problems)
export class UnitNameTooLongError extends Error { }
```

**File Structure:**

```
domain/
├── exceptions/                                    ← Exceptions here
│   ├── unit-name-too-long.exception.ts           ← kebab-case.exception.ts
│   ├── unit-not-exist.exception.ts
│   └── invalid-unit-type.exception.ts
│
└── value-objects/
    ├── unit-name.ts                              ← Throws exceptions
    └── unit-type.ts
```

**Base Exception Classes:**

```typescript
// Domain Layer
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

// Application Layer
export abstract class ApplicationException extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

// Infrastructure Layer
export abstract class InfrastructureException extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message)
    this.name = this.constructor.name
  }
}
```

**Exception Types by Layer:**

**Domain Exceptions (Business Rules):**
```typescript
// Value Object validation
export class UnitNameTooLong extends DomainException { }
export class InvalidUnitType extends DomainException { }

// Entity not found
export class UnitNotExist extends DomainException {
  constructor(id: string) {
    super(`Unit with id ${id} does not exist`)
  }
}

// Business rule violation
export class CannotDeleteActiveCategory extends DomainException {
  constructor() {
    super('Cannot delete an active category with products')
  }
}
```

**Application Exceptions (Use Cases):**
```typescript
// Operation not allowed
export class OperationNotAllowed extends ApplicationException { }

// Concurrent modification
export class ConcurrentModification extends ApplicationException { }
```

**Infrastructure Exceptions (Technical):**
```typescript
// External service issues
export class DatabaseConnectionFailed extends InfrastructureException { }
export class ExternalServiceUnavailable extends InfrastructureException { }
```

**Exception Naming Rules:**

- ✅ **File names:** `kebab-case.exception.ts`
- ✅ **Class names:** `PascalCase extends DomainException`
- ✅ **Suffix:** Always `.exception.ts` (not `.error.ts`)
- ✅ **Location:** `domain/exceptions/` for business rules
- ✅ **Extend:** `DomainException`, `ApplicationException`, or `InfrastructureException`
- ❌ **Never extend:** `Error` directly (use base exception classes)

**Example - Value Object with Exception:**

```typescript
// domain/value-objects/unit-name.ts
import { StringValueObject } from '@/shared/domain/value-objects/string.vo'
import { UnitNameTooLong } from '../exceptions/unit-name-too-long.exception'

export class UnitName extends StringValueObject {
  private static readonly MAX_LENGTH = 50

  constructor(value: string) {
    super(value)
    this.ensureNameIsNotTooLong(value)
  }

  private ensureNameIsNotTooLong(value: string): void {
    if (value.length > UnitName.MAX_LENGTH) {
      throw new UnitNameTooLong() // ✅ Throws exception
    }
  }
}
```

**When to throw Exceptions:**
- ✅ Business rule violation (invalid data, state)
- ✅ Entity not found in repository
- ✅ Operation not permitted by domain logic
- ✅ Aggregate invariant violation
- ❌ System errors (use Error for these)
- ❌ Programming bugs (use Error for these)

#### 7. **Criteria Pattern for Complex Queries**

**⚠️ CRITICAL: Pattern for Pagination, Filtering, and Sorting**

The Criteria pattern is used to handle complex queries with pagination, filtering, and sorting in a domain-driven, framework-agnostic way.

**Architecture Overview:**

```
┌──────────────────────────────────────────────────────────────┐
│ Presentation Layer                                           │
│ - Request DTO: Receives query params (?filters[name]=X)    │
│ - Transforms to Criteria                                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Application Layer                                            │
│ - Use Case: Receives Criteria, returns PaginatedResult      │
│ - Handler: Transforms Domain → Response DTOs                │
└──────────────────────────────────────────────────────────────┐
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Domain Layer (Pure - Business Language)                     │
│ - Criteria: filters, order, pagination (with pageSize)     │
│ - Filter: field, operator, value                            │
│ - Order: orderBy, orderType (ASC/DESC)                      │
│ - Pagination: page, pageSize (NOT limit!)                   │
│ - PaginatedResult<T>: data, meta                            │
│ - Repository.matching(criteria): interface method           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ Infrastructure Layer (SQL Translation)                      │
│ - TypeOrmCriteriaConverter: Criteria → QueryBuilder         │
│ - Translates pageSize → .take() (SQL LIMIT)                │
└──────────────────────────────────────────────────────────────┘
```

**Key Design Decisions:**

**1. `pageSize` instead of `limit`:**
- ✅ **Domain uses:** `pageSize` (business language)
- ✅ **Infrastructure translates to:** SQL `LIMIT`, TypeORM `.take()`
- ❌ **Never use:** `limit` in domain layer

**Rationale:**
- `limit` is SQL-specific terminology (infrastructure concern)
- `pageSize` is universal business language
- Aligns with Google APIs, Microsoft Graph API standards
- Maintains independence from database implementation

**2. Repository Interface:**

```typescript
// ✅ CORRECT - Domain repository interface
export abstract class IngredientCategoryRepository {
  abstract save(category: IngredientCategory): Promise<void>
  abstract search(id: IngredientCategoryId): Promise<IngredientCategory | null>
  abstract searchAll(): Promise<IngredientCategory[]>

  // Criteria-based search
  abstract matching(criteria: Criteria): Promise<PaginatedResult<IngredientCategory>>
}
```

**3. Use Case Pattern:**

```typescript
// ✅ CORRECT - Use case with run() method
export class SearchIngredientCategoriesByCriteria {
  constructor(private readonly repository: IngredientCategoryRepository) {}

  async run(criteria: Criteria): Promise<PaginatedResult<IngredientCategory>> {
    return this.repository.matching(criteria)
  }
}
```

**Important:** Use cases use `run()` method, NOT `execute()`. Only handlers (CQRS adapters) use `execute()`.

**4. Handler Transformation:**

```typescript
// ✅ CORRECT - Handler transforms domain → DTOs
@QueryHandler(SearchIngredientCategoriesByCriteriaQuery)
export class SearchIngredientCategoriesByCriteriaHandler {
  constructor(private readonly useCase: SearchIngredientCategoriesByCriteria) {}

  async execute(query: SearchIngredientCategoriesByCriteriaQuery) {
    const result = await this.useCase.run(query.criteria)

    // Transform domain to DTOs in handler (NOT in use case)
    return {
      data: result.data.map(cat => IngredientCategoryResponse.fromDomain(cat)),
      meta: result.meta
    }
  }
}
```

**5. Request DTO with Query Params:**

```typescript
// ✅ CORRECT - Request DTO
export class SearchIngredientCategoriesRequest {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number  // ← NOT limit!

  @IsOptional()
  @IsString()
  orderBy?: string

  @IsOptional()
  @IsEnum(['asc', 'desc', 'ASC', 'DESC'])
  orderType?: 'asc' | 'desc'

  @IsOptional()
  filters?: Record<string, any>

  toCriteria(): Criteria {
    return Criteria.fromPrimitives({
      filters: this.buildFilters(),
      orderBy: this.orderBy,
      orderType: this.orderType,
      page: this.page,
      pageSize: this.pageSize
    })
  }
}
```

**6. Controller Endpoint:**

```typescript
// ✅ CORRECT - Separate endpoint for search
@Controller('ingredient-categories')
export class IngredientCategoryController {
  // ... other endpoints

  @Get('search')
  async search(
    @Query() dto: SearchIngredientCategoriesRequest
  ): Promise<PaginatedIngredientCategoryListResponse> {
    const criteria = dto.toCriteria()
    const query = new SearchIngredientCategoriesByCriteriaQuery(criteria)
    return this.queryBus.execute(query)
  }
}
```

**Supported Filter Operators:**

```typescript
export enum FilterOperator {
  EQUAL = '=',              // Exact match
  NOT_EQUAL = '!=',         // Not equal
  GT = '>',                 // Greater than
  GTE = '>=',               // Greater than or equal
  LT = '<',                 // Less than
  LTE = '<=',               // Less than or equal
  CONTAINS = 'CONTAINS',    // ILIKE %value% (case-insensitive)
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',  // ILIKE value%
  ENDS_WITH = 'ENDS_WITH',      // ILIKE %value
  IN = 'IN',                    // Multiple values
  NOT_IN = 'NOT_IN',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL'
}
```

**API Usage Examples:**

```bash
# Simple pagination
GET /ingredient-categories/search?page=2&pageSize=10

# Filter by equality
GET /ingredient-categories/search?filters[isActive]=true&pageSize=20

# Search by text (contains)
GET /ingredient-categories/search?filters[name]=contains:car&orderBy=name&orderType=asc

# Multiple filters + sorting
GET /ingredient-categories/search?filters[isActive]=true&filters[color]=blue&orderBy=sortOrder&orderType=asc

# Range filter
GET /ingredient-categories/search?filters[sortOrder]=gte:5&filters[sortOrder]=lte:20

# Advanced operators
GET /ingredient-categories/search?filters[name]=starts_with:Car
GET /ingredient-categories/search?filters[color]=in:red,blue,green
```

**Response Structure:**

```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "Carnes",
      "description": "Ingredientes cárnicos",
      "isActive": true,
      ...
    }
  ],
  "meta": {
    "total": 150,
    "page": 2,
    "pageSize": 20,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true
  }
}
```

**Files Structure:**

```
src/
├── shared/
│   ├── domain/
│   │   └── criteria/
│   │       ├── criteria.ts                    # Main Criteria aggregate
│   │       ├── filter.ts                      # Filter VO
│   │       ├── filters.ts                     # Filters collection
│   │       ├── filter-operator.ts             # Operators enum
│   │       ├── filter-field.ts                # Field VO
│   │       ├── filter-value.ts                # Value VO
│   │       ├── order.ts                       # Order VO
│   │       ├── order-by.ts                    # OrderBy VO
│   │       ├── order-type.ts                  # ASC/DESC enum
│   │       ├── pagination.ts                  # Pagination VO (with pageSize!)
│   │       └── paginated-result.ts            # Result wrapper
│   │
│   └── infrastructure/
│       └── persistence/
│           └── typeorm/
│               └── typeorm-criteria-converter.ts  # Criteria → QueryBuilder
│
└── modules/
    └── [module-name]/
        ├── domain/
        │   └── repositories/
        │       └── [entity].repository.ts     # Add: matching(criteria)
        │
        ├── application/
        │   └── search-by-criteria/
        │       ├── search-[entity]-by-criteria.query.ts
        │       ├── search-[entity]-by-criteria.ts      # Use case with run()
        │       └── search-[entity]-by-criteria.handler.ts
        │
        ├── infrastructure/
        │   └── persistence/
        │       └── typeorm/
        │           └── typeorm-[entity].repository.ts  # Implement matching()
        │
        └── presentation/
            └── http/
                └── dto/
                    └── search-[entity].request.ts      # Query params → Criteria
```

**When to Use Criteria Pattern:**

⚠️ **IMPORTANT:** Not all modules need Criteria! Use it pragmatically.

✅ **Use Criteria when:**
- Expected records > 100
- Complex filters needed (multiple fields, operators)
- Dynamic sorting required
- User-facing search/list endpoints
- Data grows over time

❌ **DON'T use Criteria when:**
- Small, bounded domain (< 50 records)
- Static/semi-static data (configuration, catalogs)
- Simple list for UI (selects, tabs)
- Fixed ordering is sufficient

**Examples:**
- ✅ **With Criteria:** `products`, `orders`, `customers`, `ingredients`, `inventory-movements`
- ❌ **Without Criteria:** `ingredient-categories` (~20), `product-categories` (~15), `units` (~20)

📄 **See also:** [API-DESIGN-DECISIONS.md](./API-DESIGN-DECISIONS.md) for detailed rationale on unified endpoints with pagination.

**Implementation Checklist:**

When implementing Criteria for a new module:

- [ ] **Verify module needs Criteria** (> 100 records expected or complex filters)
- [ ] Add `matching(criteria)` to domain repository interface
- [ ] Implement `matching()` in TypeORM repository using `TypeOrmCriteriaConverter`
- [ ] Create use case `Search[Entity]ByCriteria` with `run()` method
- [ ] Create query and handler for CQRS
- [ ] Create request DTO with `pageSize` (not `limit`) and defaults (`page=1`, `pageSize=20`)
- [ ] Use single `GET /[resource]` endpoint (NOT `/[resource]/search`)
- [ ] Register use case and handler in module
- [ ] Test with various filter operators and pagination

**Best Practices:**

✅ **DO:**
- Use `pageSize` in domain, translate to `limit` in infrastructure
- Keep Criteria VOs pure (no framework dependencies)
- Transform domain → DTOs in handlers, NOT use cases
- Use `run()` for use case methods, `execute()` for handlers
- Support operator prefixes in query params (e.g., `contains:`, `gte:`)
- Validate pageSize limits (1-100)

❌ **DON'T:**
- Use `limit` in domain layer (SQL-specific term)
- Put TypeORM/SQL logic in domain layer
- Return DTOs from use cases (return domain objects)
- Call `execute()` on use cases (use `run()`)
- Forget to apply filters to count query (for accurate total)
- Allow unbounded pageSize (enforce max 100)

#### 8. **File Storage Pattern (EventBus Style)**

**⚠️ CRITICAL: Simple Dependency Injection per Module**

The file storage infrastructure follows the **same pattern as EventBus**:
- Shared infrastructure exports concrete implementations
- Each module chooses which implementation to use via `provide/useExisting`
- Use cases inject the domain abstract class directly
- **NO adapters, NO tokens, NO over-engineering**

```
┌─────────────────────────────────────────────┐
│ Products Module                              │
│                                              │
│  Use Case                                   │
│  └─ depends on → FileStorageRepository      │
│                  (domain abstract class)    │
│                                              │
│  Module Registration                        │
│  └─ provide: FileStorageRepository          │
│     useExisting: CloudflareImagesStorage    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Invoices Module (Future)                    │
│                                              │
│  Use Case                                   │
│  └─ depends on → FileStorageRepository      │
│                  (same abstraction!)        │
│                                              │
│  Module Registration                        │
│  └─ provide: FileStorageRepository          │
│     useExisting: S3DocumentStorage          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Shared Infrastructure                       │
│                                              │
│  FileStorageModule                          │
│  ├─ CloudflareImagesStorage                 │
│  ├─ LocalFileStorage                        │
│  └─ S3DocumentStorage (future)              │
│     (all implement FileStorageRepository)   │
└─────────────────────────────────────────────┘
```

**Comparison with EventBus Pattern:**

| Aspect | EventBus | FileStorage |
|--------|----------|-------------|
| **Domain Abstraction** | `abstract class EventBus` | `abstract class FileStorageRepository` |
| **Infrastructure Impl** | `InMemoryNestEventBus` | `CloudflareImagesStorage` / `S3DocumentStorage` |
| **Module Export** | Export concrete implementation | Export concrete implementations |
| **Module Registration** | `provide: EventBus, useExisting: InMemoryNestEventBus` | `provide: FileStorageRepository, useExisting: CloudflareImagesStorage` |
| **Use Case Injection** | `constructor(eventBus: EventBus)` | `constructor(storage: FileStorageRepository)` |
| **Adapters Needed?** | ❌ NO | ❌ NO |
| **Tokens Needed?** | ❌ NO | ❌ NO |

**Implementation:**

**1. Domain Layer (Shared Abstract Class):**

```typescript
// src/shared/domain/file-storage/repositories/file-storage.repository.ts
export abstract class FileStorageRepository {
  abstract upload(file: FileUpload): Promise<UploadedFile>
  abstract delete(storageKey: string): Promise<void>
  abstract getPublicUrl(storageKey: string, variant?: string): string
}
```

**2. Infrastructure Implementations:**

```typescript
// src/shared/infrastructure/storage/cloudflare-images/cloudflare-images-storage.service.ts
@Injectable()
export class CloudflareImagesStorage implements FileStorageRepository {
  async upload(file: FileUpload): Promise<UploadedFile> { ... }
  async delete(storageKey: string): Promise<void> { ... }
  getPublicUrl(storageKey: string, variant?: string): string { ... }
}

// src/shared/infrastructure/storage/local/local-file-storage.service.ts
@Injectable()
export class LocalFileStorage implements FileStorageRepository {
  // Same interface, different implementation
}
```

**3. Shared Module (Export Implementations):**

```typescript
// src/shared/infrastructure/storage/file-storage.module.ts
@Global()
@Module({
  providers: [
    CloudflareImagesStorage,
    LocalFileStorage
    // Future: S3DocumentStorage
  ],
  exports: [
    CloudflareImagesStorage,
    LocalFileStorage
    // Future: S3DocumentStorage
  ]
})
export class FileStorageModule {}
```

**4. Module Registration (Each Module Chooses):**

```typescript
// src/modules/products/products.module.ts
import { CloudflareImagesStorage } from '@/shared/infrastructure/storage/cloudflare-images/cloudflare-images-storage.service'
import { FileStorageRepository } from '@/shared/domain/file-storage'

@Module({
  imports: [FileStorageModule],
  providers: [
    {
      provide: FileStorageRepository,
      useExisting: CloudflareImagesStorage  // ← Products use Cloudflare
    },
    // ... use cases, handlers, etc.
  ]
})
export class ProductsModule {}

// src/modules/invoices/invoices.module.ts (future)
@Module({
  imports: [FileStorageModule],
  providers: [
    {
      provide: FileStorageRepository,
      useExisting: S3DocumentStorage  // ← Invoices use S3
    }
  ]
})
export class InvoicesModule {}
```

**5. Use Case (Simple Injection):**

```typescript
// src/modules/products/application/create/create-product.use-case.ts
export class CreateProductUseCase {
  constructor(
    private repository: ProductRepository,
    private fileStorage: FileStorageRepository  // ← Domain abstract class
  ) {}

  async run(data: ProductData, imageFile: FileUpload): Promise<void> {
    const uploaded = await this.fileStorage.upload(imageFile)

    const product = Product.create({
      ...data,
      imageUrl: uploaded.publicUrl,
      imageStorageKey: uploaded.storageKey
    })

    await this.repository.save(product)
  }
}
```

**Adding New Storage Implementation:**

```typescript
// 1. Create new service implementing FileStorageRepository
@Injectable()
export class S3DocumentStorage implements FileStorageRepository {
  async upload(file: FileUpload): Promise<UploadedFile> { ... }
  async delete(storageKey: string): Promise<void> { ... }
  getPublicUrl(storageKey: string, variant?: string): string { ... }
}

// 2. Add to FileStorageModule
@Module({
  providers: [CloudflareImagesStorage, LocalFileStorage, S3DocumentStorage],
  exports: [CloudflareImagesStorage, LocalFileStorage, S3DocumentStorage]
})

// 3. Use in any module
{
  provide: FileStorageRepository,
  useExisting: S3DocumentStorage
}

// ✅ No changes needed in use cases!
```

**Testing:**

```typescript
describe('CreateProductUseCase', () => {
  it('should upload file and create product', async () => {
    const mockStorage: FileStorageRepository = {
      upload: jest.fn().mockResolvedValue({
        storageKey: 'key-123',
        publicUrl: 'https://cdn.example.com/image.jpg',
        fileName: 'product.jpg',
        sizeInBytes: 1024,
        mimeType: 'image/jpeg',
        uploadedAt: new Date()
      }),
      delete: jest.fn(),
      getPublicUrl: jest.fn()
    }

    const useCase = new CreateProductUseCase(mockRepo, mockStorage)
    await useCase.run(productData, imageFile)

    expect(mockStorage.upload).toHaveBeenCalledWith(imageFile)
  })
})
```

**Benefits:**

✅ **Simple**: Direct injection, no intermediate layers
✅ **Flexible**: Each module chooses its storage implementation
✅ **DDD Pure**: Use cases depend only on domain abstraction
✅ **Testable**: Easy to mock abstract class
✅ **Consistent**: Same pattern across the codebase (EventBus, Repositories, Storage)
✅ **Scalable**: Add new implementations without changing use cases

**Anti-patterns to AVOID:**

❌ **DON'T** create module-specific storage interfaces (`ProductImageStorage`, `InvoiceDocumentStorage`)
❌ **DON'T** create adapters that only delegate without adding logic
❌ **DON'T** use Symbol tokens for dependency injection
❌ **DON'T** inject concrete implementations in use cases

📄 **See also:** [USAGE-EXAMPLE.md](../../shared/infrastructure/storage/USAGE-EXAMPLE.md) for detailed usage patterns and examples

#### 9. **Value Objects Naming and Organization Convention**

**⚠️ CRITICAL: Consistent VO Naming Across Codebase**

Based on DDD best practices (Eric Evans, Vaughn Vernon), CodelyTV patterns, and industry standards, Value Objects follow these strict conventions:

**File Naming:**

```typescript
// ✅ CORRECT - No suffixes, kebab-case
product-name.ts          → export class ProductName extends StringValueObject
product-id.ts            → export class ProductId extends Uuid
product-price.ts         → export class ProductPrice extends Money

// ❌ INCORRECT - No technical suffixes
product-name.vo.ts       → Technical suffix violates Ubiquitous Language
product-name-vo.ts       → Technical suffix violates Ubiquitous Language
ProductName.ts           → PascalCase inconsistent with project
```

**Folder Organization:**

Value Objects are placed **directly in the domain/ folder** alongside aggregates and entities (flat structure).

```
src/modules/products/domain/
├── product.ts                    # Aggregate Root
├── product-id.ts                 # Value Object (flat, not in subdirectory)
├── product-name.ts               # Value Object
├── product-price.ts              # Value Object
├── product-status.ts             # Value Object
├── events/                       # Domain Events subdirectory
│   ├── product-created.event.ts
│   └── product-updated.event.ts
├── exceptions/                   # Domain Exceptions subdirectory
│   ├── product-not-found.exception.ts
│   └── invalid-product-price.exception.ts
└── repositories/                 # Repository Interfaces subdirectory
    └── product.repository.ts
```

**Rationale:**

1. **Ubiquitous Language** (Eric Evans): File names should reflect domain concepts, not technical patterns
2. **CodelyTV Pattern**: VOs in flat structure with aggregates, no technical suffixes
3. **Industry Standard**: Microsoft, Netflix, Spring projects use flat structure without suffixes
4. **Simplicity**: Fewer directories, clearer structure, easier navigation
5. **DDD Principles**: VOs are part of the aggregate, not a separate technical category

**Shared Value Objects:**

```
src/shared/domain/value-objects/
├── uuid.ts              # NOT uuid.vo.ts
├── string.ts            # NOT string.vo.ts
├── money.ts             # NOT money.vo.ts
├── quantity.ts
├── email.ts
└── phone.ts
```

**Exception - Large Modules (> 15 domain files):**

For modules with many domain files, organize by **domain concept**, NOT by technical type:

```
src/modules/orders/domain/
├── order.ts                      # Aggregate
├── order-id.ts
├── order-status.ts
├── customer/                     # Subdomain: Customer (NOT value-objects/)
│   ├── customer-name.ts
│   ├── customer-email.ts
│   └── customer-phone.ts
├── shipping/                     # Subdomain: Shipping
│   ├── shipping-address.ts
│   ├── shipping-method.ts
│   └── shipping-cost.ts
└── repositories/
    └── order.repository.ts
```

**Import Convention:**

```typescript
// ✅ CORRECT - Direct imports from domain/
import { ProductName } from './product-name'
import { ProductId } from './product-id'
import { Uuid } from '@/shared/domain/value-objects/uuid'

// ❌ INCORRECT - No value-objects/ subdirectory
import { ProductName } from './value-objects/product-name'
```

**Benefits:**

✅ **Ubiquitous Language**: Names reflect domain, not architecture
✅ **DDD Canonical**: Follows Evans/Vernon recommendations
✅ **CodelyTV Aligned**: Matches project's architectural reference
✅ **Industry Standard**: Used by major tech companies
✅ **Simple Navigation**: Flat structure easier to browse
✅ **Consistent**: Same pattern across all modules

**Anti-patterns to AVOID:**

❌ **DON'T** use `.vo.ts`, `.value-object.ts`, or `-vo.ts` suffixes
❌ **DON'T** create `value-objects/` subdirectories for technical grouping
❌ **DON'T** use PascalCase for file names (use kebab-case)
❌ **DON'T** organize by technical type instead of domain concept

#### 10. **Use Cases Naming and Organization Convention**

**⚠️ CRITICAL: Consistent Use Case Naming Across Codebase**

Based on DDD best practices (Eric Evans, Vaughn Vernon), CodelyTV patterns, and Clean Architecture principles, Use Cases follow these strict conventions:

**Class Naming:**

```typescript
// ✅ CORRECT - Action + Entity, NO suffix
export class CreateProduct {
  async run(...): Promise<void> { }
}

export class FindProduct {
  async run(...): Promise<Product> { }
}

export class UpdateProduct {
  async run(...): Promise<void> { }
}

export class DeleteProduct {
  async run(...): Promise<void> { }
}

export class SearchProductsByCriteria {
  async run(...): Promise<PaginatedResult<Product>> { }
}

// ❌ INCORRECT - Technical suffix
export class CreateProductUseCase { }      // Violates Ubiquitous Language
export class ProductCreator { }            // CodelyTV PHP style, not our pattern
export class CreateProductService { }      // Wrong layer terminology
```

**File Naming:**

```typescript
// ✅ CORRECT - kebab-case.ts matching class name
create-product.ts       → export class CreateProduct
find-product.ts         → export class FindProduct
update-product.ts       → export class UpdateProduct
delete-product.ts       → export class DeleteProduct

// ❌ INCORRECT
create-product.use-case.ts    // Technical suffix unnecessary
CreateProduct.ts              // PascalCase inconsistent with project
product-creator.ts            // Different from class name pattern
```

**Method Naming:**

```typescript
// ✅ CORRECT - run() for use cases
export class CreateProduct {
  async run(...): Promise<void> {    // ← ALWAYS run()
    // Use case logic
  }
}

// ❌ INCORRECT
async execute(...) { }    // ← execute() is ONLY for HANDLERS
async create(...) { }     // ← Too specific, not generic
async invoke(...) { }     // ← Not our convention
```

**Folder Structure:**

```
src/modules/products/application/
├── create/
│   ├── create-product.ts              # Use case (pure class)
│   ├── create-product.command.ts      # Command (POJO)
│   └── create-product.handler.ts      # Handler (CQRS adapter)
├── update/
│   ├── update-product.ts
│   ├── update-product.command.ts
│   └── update-product.handler.ts
├── delete/
│   ├── delete-product.ts
│   ├── delete-product.command.ts
│   └── delete-product.handler.ts
├── find/
│   ├── find-product.ts
│   ├── find-product.query.ts
│   └── find-product.handler.ts
└── search-by-criteria/
    ├── search-products-by-criteria.ts
    ├── search-products-by-criteria.query.ts
    └── search-products-by-criteria.handler.ts
```

**Handler vs Use Case:**

```typescript
// Use Case - Pure class with run()
export class CreateProduct {
  constructor(
    private readonly repository: ProductRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(id: string, name: string, ...): Promise<void> {  // ← run()
    const product = Product.create(id, name, ...)
    await this.repository.save(product)
    await this.eventBus.publish(product.pullDomainEvents())
  }
}

// Handler - CQRS adapter with execute()
@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler {
  constructor(private readonly useCase: CreateProduct) {}

  async execute(command: CreateProductCommand): Promise<void> {  // ← execute()
    return this.useCase.run(                                    // ← Calls run()
      command.id,
      command.name,
      ...
    )
  }
}
```

**Rationale:**

1. **Ubiquitous Language** (Eric Evans): Class names should reflect business actions, not technical patterns
2. **CodelyTV Influence**: Simple action-based naming without technical suffixes
3. **Clean Architecture**: Use cases named by their intent, not their role
4. **Consistency**: 81% of existing codebase already follows this pattern
5. **Clarity**: Shorter names, no redundancy (`application/` folder already indicates purpose)

**Method Convention - run() vs execute():**

| Component | Method | Reason |
|-----------|--------|--------|
| **Use Case** | `run()` | Pure business logic, framework-agnostic |
| **Handler** | `execute()` | CQRS adapter, implements ICommandHandler/IQueryHandler |
| **Domain Service** | Custom | Named by domain action (e.g., `calculate()`, `validate()`) |

**Benefits:**

✅ **Ubiquitous Language**: Names reflect domain actions
✅ **CodelyTV Aligned**: Matches project's architectural reference
✅ **Clean Code**: Shorter, more readable class names
✅ **Framework Independent**: Use cases don't expose framework details
✅ **Consistent**: One clear pattern across all modules

**Anti-patterns to AVOID:**

❌ **DON'T** add `UseCase` suffix to class names
❌ **DON'T** use `.use-case.ts` suffix in file names
❌ **DON'T** use `execute()` method in use cases (only handlers)
❌ **DON'T** use agent nouns like `Creator`, `Finder` (CodelyTV PHP pattern, not TypeScript)
❌ **DON'T** use PascalCase for file names (use kebab-case)

---

## 📁 Project Structure

```
src/
├── core/                                    # Application core
│   ├── config/                             # Configuration files
│   ├── filters/                            # Global exception filters
│   ├── modules/                            # Feature module definitions
│   └── utils/                              # Utility functions
│
├── modules/                                 # Business modules (bounded contexts)
│   └── ingredient-categories/              # 🌟 REFERENCE MODULE
│       ├── domain/                         # Pure domain logic (NO decorators)
│       │   ├── ingredient-category.ts      # Aggregate root
│       │   ├── ingredient-category-*.ts    # Value objects
│       │   ├── events/                     # Domain events
│       │   ├── exceptions/                 # Domain exceptions
│       │   └── repositories/               # Repository interfaces
│       │
│       ├── application/                    # Use cases & orchestration
│       │   ├── create/
│       │   │   ├── create-ingredient-category.ts          # Use case (pure)
│       │   │   ├── create-ingredient-category.command.ts  # Command (POJO)
│       │   │   └── create-ingredient-category.handler.ts  # Handler (adapter)
│       │   └── subscribers/                # Domain event subscribers
│       │
│       ├── infrastructure/                 # External concerns
│       │   └── persistence/
│       │       └── typeorm/
│       │           ├── ingredient-category.entity.ts      # TypeORM entity
│       │           └── typeorm-ingredient-category.repository.ts
│       │
│       └── presentation/                   # API layer
│           └── http/
│               ├── controllers/            # REST controllers
│               └── dto/                    # Request/Response DTOs
│
├── shared/                                  # Shared kernel
│   ├── domain/                             # Shared domain primitives
│   │   ├── aggregate-root.ts              # Base aggregate
│   │   ├── value-objects/                  # Reusable VOs (Uuid, Money, etc)
│   │   ├── events/                         # Event bus interfaces
│   │   └── exceptions/                     # Base exceptions
│   │
│   ├── application/                        # Shared application
│   │   └── bus/                           # Command/Query bus interfaces
│   │
│   └── infrastructure/                     # Shared infrastructure
│       ├── cqrs/                          # CQRS adapters
│       ├── event-bus/                     # Event bus implementation
│       ├── event-sourcing/                # Event store
│       └── database/                       # Database config & migrations
│
├── config/                                  # App-level configuration
│   ├── database/                           # TypeORM config
│   └── env/                                # Environment validation
│
└── main.ts                                  # Application entry point

tests/                                       # Test files (mirrors src structure)
├── modules/                                # Test by module
│   └── ingredient-categories/
│       ├── __mothers__/                   # Object Mothers (test factories)
│       ├── domain/                        # Domain unit tests
│       ├── application/                   # Use case tests
│       └── infrastructure/                # Integration tests
│
└── shared/                                 # Shared test utilities
    ├── __mothers__/                       # Shared test factories
    └── infrastructure/                    # Test infrastructure
```

---

## 🎨 Design Decisions & Patterns

### 1. Domain Layer (Pure)

**Characteristics:**
- ✅ 100% pure TypeScript (no decorators except where absolutely necessary)
- ✅ No dependencies on frameworks (NestJS, TypeORM, etc.)
- ✅ Contains business logic and rules
- ✅ Defines interfaces (repositories, services)
- ❌ Never imports from infrastructure or presentation layers

**Example - Aggregate Root:**

```typescript
// ✅ CORRECT: Pure domain aggregate
export class IngredientCategory extends AggregateRoot {
  private constructor(
    public readonly id: IngredientCategoryId,
    private readonly name: IngredientCategoryName,
    // ... other value objects
  ) {
    super()
  }

  static create(...params): IngredientCategory {
    const category = IngredientCategory.fromPrimitives({...})
    category.record(new IngredientCategoryCreatedEvent({...}))
    return category
  }

  static fromPrimitives(primitives: Primitives): IngredientCategory {
    return new IngredientCategory(...)
  }

  toPrimitives(): Primitives {
    return { id: this.id.value, name: this.name.value, ... }
  }
}
```

**Example - Repository Interface:**

```typescript
// ✅ CORRECT: Interface in domain
export interface IngredientCategoryRepository {
  save(category: IngredientCategory): Promise<void>
  findById(id: IngredientCategoryId): Promise<IngredientCategory | null>
}
```

### 2. Application Layer (Use Cases)

**Characteristics:**
- ✅ Contains application logic (orchestration)
- ✅ Use Cases are pure classes (no decorators)
- ✅ Handlers are thin adapters to CQRS
- ✅ Commands/Queries are POJOs
- ✅ Depends on domain interfaces

**Example - Use Case (Pure):**

```typescript
// ✅ CORRECT: Pure use case class
export class CreateIngredientCategoryUseCase {
  constructor(
    private readonly repository: IngredientCategoryRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(
    id: string,
    name: string,
    // ... other params
  ): Promise<void> {
    const category = IngredientCategory.create(id, name, ...)
    await this.repository.save(category)

    const events = category.pullDomainEvents()
    await this.eventBus.publish(events)
  }
}
```

**Example - Command Handler (Adapter):**

```typescript
// ✅ CORRECT: Thin adapter to CQRS
@CommandHandler(CreateIngredientCategoryCommand)
export class CreateIngredientCategoryCommandHandler implements ICommandHandler {
  constructor(private readonly useCase: CreateIngredientCategoryUseCase) {}

  async execute(command: CreateIngredientCategoryCommand): Promise<void> {
    return this.useCase.execute(
      command.id,
      command.name,
      // ... pass all params
    )
  }
}
```

**Example - Module Registration (useFactory):**

```typescript
// ✅ CORRECT: Use factory to maintain purity
@Module({
  providers: [
    // Repository
    {
      provide: IngredientCategoryRepository,
      useClass: TypeOrmIngredientCategoryRepository
    },

    // Use Case with factory
    createUseCaseProvider(
      CreateIngredientCategoryUseCase,
      [IngredientCategoryRepository, EventBus]
    ),

    // Handler
    CreateIngredientCategoryCommandHandler
  ]
})
```

### 3. Infrastructure Layer

**Characteristics:**
- ✅ Implements domain interfaces
- ✅ Uses framework decorators (@Injectable, @Entity, etc.)
- ✅ Handles persistence, external APIs, events
- ✅ TypeORM entities are separate from Domain aggregates

**Example - TypeORM Entity (Separate from Aggregate):**

```typescript
// ✅ CORRECT: Separate entity for persistence
@Entity('ingredient_categories')
export class IngredientCategoryEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 100 })
  name: string

  // ... other columns with TypeORM decorators
}
```

**Example - Repository Implementation:**

```typescript
// ✅ CORRECT: Implements domain interface
@Injectable()
export class TypeOrmIngredientCategoryRepository
  implements IngredientCategoryRepository {

  constructor(
    @InjectRepository(IngredientCategoryEntity)
    private readonly repository: Repository<IngredientCategoryEntity>
  ) {}

  async save(category: IngredientCategory): Promise<void> {
    const primitives = category.toPrimitives()
    const entity = this.repository.create(primitives)
    await this.repository.save(entity)
  }

  async findById(id: IngredientCategoryId): Promise<IngredientCategory | null> {
    const entity = await this.repository.findOne({ where: { id: id.value } })
    if (!entity) return null
    return IngredientCategory.fromPrimitives(entity)
  }
}
```

### 4. Event-Driven Architecture

**Domain Events:**
- Aggregates record events when state changes
- Events are published AFTER persistence succeeds
- Subscribers react to events asynchronously

**Event Flow:**

```typescript
// 1. Aggregate records event
const category = IngredientCategory.create(...)
category.record(new IngredientCategoryCreatedEvent({...}))

// 2. Use case publishes after save
await repository.save(category)
const events = category.pullDomainEvents()
await eventBus.publish(events)

// 3. Subscribers react
@Injectable()
export class ReactOnIngredientCategoryCreated
  implements DomainEventSubscriber<IngredientCategoryCreatedEvent> {

  subscribedTo(): DomainEventClass[] {
    return [IngredientCategoryCreatedEvent]
  }

  async on(event: IngredientCategoryCreatedEvent): Promise<void> {
    // React to event
  }
}
```

**Event Store:**
- All domain events are persisted in `event_store` table
- `PersistDomainEventsSubscriber` captures ALL events automatically
- Enables event sourcing, audit, and replay capabilities

---

## 🧪 Testing Strategy (CodelyTV Pattern)

### Test Structure

```
tests/
├── modules/
│   └── ingredient-categories/
│       ├── __mothers__/              # Object Mothers (test factories)
│       │   ├── IngredientCategoryMother.ts
│       │   ├── IngredientCategoryIdMother.ts
│       │   └── IngredientCategoryCreatedEventMother.ts
│       │
│       ├── domain/                   # Unit tests for domain
│       │   ├── IngredientCategory.spec.ts
│       │   ├── IngredientCategoryId.spec.ts
│       │   └── IngredientCategoryName.spec.ts
│       │
│       ├── application/              # Use case tests
│       │   ├── CreateIngredientCategory.spec.ts
│       │   └── CreateIngredientCategoryCommandHandler.spec.ts
│       │
│       └── infrastructure/           # Integration tests
│           └── TypeOrmIngredientCategoryRepository.spec.ts
│
└── shared/
    └── __mothers__/                  # Shared test utilities
        ├── UuidMother.ts
        ├── StringMother.ts
        └── NumberMother.ts
```

### Object Mother Pattern

**Purpose:** Centralize test object creation with sensible defaults

```typescript
export class IngredientCategoryMother {
  static create(params: Partial<Primitives> = {}): IngredientCategory {
    const primitives: Primitives = {
      id: params.id ?? UuidMother.random(),
      name: params.name ?? StringMother.random(),
      description: params.description ?? StringMother.sentence(),
      // ... with defaults
    }
    return IngredientCategory.fromPrimitives(primitives)
  }

  static random(): IngredientCategory {
    return this.create()
  }

  static carnes(): IngredientCategory {
    return this.create({ name: 'Carnes', description: '...' })
  }
}
```

### Test Principles

- ✅ Fast unit tests (< 100ms)
- ✅ Isolated tests (no shared state)
- ✅ Object Mothers for test data
- ✅ No database in unit tests (use mocks)
- ✅ Clear AAA structure (Arrange, Act, Assert)
- ✅ One concept per test

---

## 🔧 Development Workflow

### Adding a New Feature

1. **Start with Domain**
   - Define Aggregate/Entity
   - Create Value Objects
   - Define Repository interface
   - Create Domain Events

2. **Application Layer**
   - Create Command/Query (POJO)
   - Implement Use Case (pure class)
   - Create Handler (adapter)

3. **Infrastructure**
   - Create TypeORM Entity
   - Implement Repository
   - Add Event Subscribers (if needed)

4. **Presentation**
   - Create Controller
   - Define Request/Response DTOs
   - Add Validation

5. **Module Registration**
   - Register in Feature Module
   - Use `useFactory` for Use Cases
   - Export repository if needed

6. **Testing**
   - Create Object Mothers
   - Write domain unit tests
   - Write use case tests
   - Write integration tests

### Commands Reference

```bash
# Development
pnpm start:dev              # Start with watch mode
pnpm start:debug            # Start with debugger

# Code Quality
pnpm lint                   # Lint and auto-fix
pnpm format                 # Format with Prettier

# Testing
pnpm test                   # Run all tests
pnpm test:watch             # Watch mode
pnpm test:cov               # With coverage

# Database
pnpm migration:generate     # Generate migration (use: name=migration_name pnpm migration:generate)
pnpm migration:run          # Run migrations
pnpm migration:revert       # Revert last migration
```

---

## ⚠️ Critical Rules & Restrictions

### ✅ DO:

- Keep Domain layer 100% pure (no decorators, no framework deps)
- Use `interface` for repository contracts in domain
- Separate TypeORM entities from Domain aggregates
- Use `useFactory` or `createUseCaseProvider` for Use Case injection
- Record domain events in aggregate, publish in use case
- Use Value Objects for domain concepts
- Follow the established module structure
- Use Object Mothers in tests
- Ask before making architectural changes
- **Use `.exception.ts` suffix for domain/business exceptions**
- **Extend `DomainException` for business rule violations**
- **Name exception files in `kebab-case.exception.ts` format**

### ❌ DON'T:

- ❌ Add `@Injectable()` to Use Cases
- ❌ Use `@Inject()` in Use Case constructors
- ❌ Mix TypeORM `@Entity` decorators with Domain Aggregates
- ❌ Put TypeORM entities in domain layer
- ❌ Import infrastructure/presentation in domain layer
- ❌ Use `localStorage`/`sessionStorage` (not available in Node.js)
- ❌ Create over-engineered abstractions prematurely
- ❌ Violate the Dependency Rule (inward dependencies only)
- ❌ **Use `.error.ts` suffix or extend `Error` directly for business exceptions**
- ❌ **Throw generic `Error` for domain validation failures**

---

## 🌟 Reference Module

**`ingredient-categories`** is the reference implementation. Study this module to understand:

- ✅ Complete Aggregate with Value Objects
- ✅ Domain Events
- ✅ Repository pattern
- ✅ Use Case + Handler pattern
- ✅ TypeORM Entity mapping
- ✅ Event Subscribers
- ✅ Controller with DTOs
- ✅ Module registration with `useFactory`
- ✅ Testing with Object Mothers

---

## 🛠️ Configuration Files

### Path Aliases

Both `tsconfig.json` and `jest.config.js` support these aliases:

- `@/*` → `src/*`
- `@shared/*` → `src/shared/*`
- `@modules/*` → `src/modules/*`
- `@core/*` → `src/core/*`
- `@test/*` → `tests/*`

### Jest Configuration

- Root: Project root (`.`)
- Test files: `*.spec.ts`
- Transform: `ts-jest`
- Module mapper: Configured for path aliases
- Coverage: Excludes `.entity.ts` and `.dto.ts`

---

## 📚 References & Inspiration

- **CodelyTV:** Pragmatic DDD and Clean Architecture
- **Martin Fowler:** Patterns of Enterprise Application Architecture
- **Eric Evans:** Domain-Driven Design (Blue Book)
- **Vaughn Vernon:** Implementing Domain-Driven Design (Red Book)
- **Robert C. Martin:** Clean Architecture, SOLID Principles

---

## 🤝 Working with Claude Code

### Your Role

As a Senior Software Engineer and Architect (FAANG-level), you should:

1. **Understand First:** Study the existing code before suggesting changes
2. **Maintain Consistency:** Follow established patterns religiously
3. **Suggest Improvements:** Propose architectural enhancements with reasoning
4. **Generate Quality Code:** Clean, SOLID, testable, performant
5. **Educate:** Explain decisions with architectural context
6. **Balance:** Pragmatism over purity (CodelyTV style)

### When Working on Tasks

- ✅ **Ask before assuming:** If uncertain about a pattern, ask
- ✅ **Propose alternatives:** Suggest better approaches with justification
- ✅ **Explain decisions:** Help us understand the "why"
- ✅ **Think long-term:** Scalable code, not over-engineering
- ✅ **Reference this file:** Cite sections when explaining architectural decisions

### Interaction Guidelines

- Study the reference module (`ingredient-categories`) for patterns
- Maintain the same code style and structure
- Use TypeScript strictly (no `any` types unless absolutely necessary)
- Write self-documenting code with clear naming
- Add comments only when the "why" is not obvious
- Test your changes mentally (or write tests if appropriate)

---

## 📊 Current Project State

**Phase:** Base Implementation & Patterns Established
**Reference Module:** `ingredient-categories` ✅ (simple `searchAll()` - no Criteria)
**Criteria Pattern:** ✅ Implemented in shared infrastructure, ready for modules that need it
**Testing:** Infrastructure created, ES6 module compatibility pending

**Completed Modules:**
- ✅ `ingredient-categories` - Simple findAll (< 50 records)
- ✅ `product-categories` - Complete CRUD
- ✅ `units` - Complete CRUD

**Pattern Decisions:**
- ✅ Criteria Pattern: Use only for modules with > 100 records (see API-DESIGN-DECISIONS.md)
- ✅ Unified Endpoints: Single GET endpoint with optional pagination/filters
- ✅ pageSize not limit: Business language in domain layer

**Next Steps:**
- Implement `products` module with Criteria pattern (will have 100+ records)
- Resolve Jest configuration for `uuid` and `@faker-js/faker` modules

---

## 🔍 Quick Checklist

Before implementing a feature:

- [ ] Does it belong in the correct layer?
- [ ] Is the domain layer pure (no decorators)?
- [ ] Are TypeORM entities separate from aggregates?
- [ ] Is the Use Case registered with `useFactory`?
- [ ] Are domain events recorded and published correctly?
- [ ] Do tests use Object Mothers?
- [ ] Does it follow the reference module structure?
- [ ] Have you checked this CLAUDE.md file?
- [ ] If implementing search/list: Use Criteria pattern with `pageSize`
- [ ] Use case methods are named `run()`, not `execute()`

---

**Last Updated:** 2025-10-24
**Version:** 1.1.0
**Maintained by:** Development Team

**Changelog:**
- **v1.1.0 (2025-10-24):** Added Criteria Pattern documentation for pagination, filtering, and sorting
- **v1.0.0 (2025-10-08):** Initial documentation

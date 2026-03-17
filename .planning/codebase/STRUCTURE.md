# Codebase Structure

**Analysis Date:** 2026-03-17

## Directory Layout

```
lasangucheria-pos/
├── src/
│   ├── main.ts                          # Application entry point
│   ├── app.module.ts                    # Root NestJS module
│   ├── config/                          # Configuration modules
│   │   ├── app.config.ts                # App configuration
│   │   ├── env/                         # Environment configuration
│   │   └── database/                    # Database/TypeORM configuration
│   ├── contexts/                        # Bounded contexts (DDD)
│   │   ├── iam/                         # Identity & Access Management
│   │   │   ├── user/
│   │   │   ├── authentication/
│   │   │   └── shared/
│   │   ├── inventory/                   # Inventory management
│   │   │   ├── ingredient-category/
│   │   │   ├── ingredient/
│   │   │   ├── batch/
│   │   │   └── stock-level/
│   │   ├── menu/                        # Menu & Products
│   │   │   ├── product-category/
│   │   │   └── product/
│   │   ├── procurement/                 # Purchase orders & suppliers
│   │   │   ├── purchase-order/
│   │   │   └── supplier/
│   │   ├── kitchen/                     # Recipes & transformations
│   │   │   ├── recipe/
│   │   │   └── transformation/
│   │   └── shared-kernel/               # Shared domain concepts
│   │       ├── unit/
│   │       └── unit-conversion/
│   ├── shared/                          # Shared infrastructure & domain
│   │   ├── domain/
│   │   │   ├── aggregate-root.ts
│   │   │   ├── criteria/                # Query criteria pattern
│   │   │   ├── events/                  # Event base classes
│   │   │   ├── exceptions/              # Base exception classes
│   │   │   ├── value-objects/           # Common value objects
│   │   │   └── interfaces/
│   │   └── infrastructure/
│   │       ├── event-bus/               # Event publishing
│   │       ├── event-sourcing/          # Event store
│   │       ├── database/                # Database setup
│   │       │   ├── typeorm/             # TypeORM migrations
│   │       │   └── seeders/             # Database seeders
│   │       ├── storage/                 # File storage
│   │       └── shared-infrastructure.module.ts
│   ├── core/                            # Core utilities
│   │   ├── filters/                     # Exception filters
│   │   └── utils/                       # Helper functions
│   └── presentation/                    # (if global - currently in modules)
│
├── tests/
│   ├── contexts/                        # Context-specific tests
│   │   └── procurement/
│   │       └── purchase-order/
│   │           ├── __mothers__/         # Object mothers (factories)
│   │           └── application/
│   └── shared/
│       ├── infrastructure/
│       └── __mothers__/
│
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── jest.config.js
```

## Directory Purposes

**src/main.ts:**
- Purpose: Bootstrap the NestJS application
- Contains: `bootstrap()` function with app configuration
- Key files: Entry point for the entire application

**src/app.module.ts:**
- Purpose: Root module that aggregates all feature modules
- Contains: Imports for configuration, shared infrastructure, and all bounded context modules
- Key files: Module declarations for IAM, Inventory, Menu, Procurement, Kitchen contexts

**src/config/:**
- Purpose: Configuration management for environment variables and database
- Contains: EnvConfigModule, DatabaseModule, TypeORM configuration
- Key files: `env/env.config.ts`, `database/database.module.ts`, `database/typeorm.config.ts`

**src/contexts/{context}/:  (Bounded Context)**
- Purpose: Isolate business domains following DDD
- Contains: Six main contexts: iam, inventory, menu, procurement, kitchen, shared-kernel
- Key files: Each context contains module definition that coordinates its layers

**src/contexts/{context}/{module}/:  (Module within Context)**
- Purpose: Logical unit representing a business entity
- Contains: domain/, application/, infrastructure/, presentation/ subdirectories
- Example: `src/contexts/inventory/ingredient-category/`

**src/contexts/{context}/{module}/domain/:  (Domain Layer)**
- Purpose: Pure business logic, no framework dependencies
- Contains: Aggregates (entity classes), value objects, domain events, exceptions, repository interfaces, domain services
- Key files:
  - `{entity}.ts`: Aggregate root
  - `{entity}-id.ts`: Identity value object
  - `{entity}-{property}.ts`: Specific value objects
  - `events/{event-name}.event.ts`: Domain events
  - `exceptions/{exception-name}.exception.ts`: Domain exceptions
  - `repositories/{entity}.repository.ts`: Repository interface
  - `services/{service}.ts`: Domain service interface

**src/contexts/{context}/{module}/application/:  (Application Layer)**
- Purpose: Use cases and CQRS handlers
- Contains: Command/Query classes, CommandHandler/QueryHandler, use cases, application services, subscribers, DTOs
- Key files:
  - `{use-case}/{use-case}.ts`: Pure use case class
  - `{use-case}/{use-case}.command.ts`: Command definition
  - `{use-case}/{use-case}.query.ts`: Query definition
  - `{use-case}/{use-case}.handler.ts`: CQRS handler
  - `services/{service}.ts`: Application service interface (read models)
  - `subscribers/react-on-{event}.ts`: Event subscribers
  - `dto/{resource}.response.ts`: Response DTOs
  - `dto/{action}.request.ts`: Request DTOs

**src/contexts/{context}/{module}/infrastructure/:**
- Purpose: Framework-specific implementations
- Contains: TypeORM entities, repository implementations, query services, external service clients
- Key files:
  - `persistence/typeorm/{entity}.entity.ts`: TypeORM entity
  - `persistence/typeorm/typeorm-{entity}.repository.ts`: Repository implementation
  - `query-services/typeorm-{service}.ts`: Query service implementation
  - `services/{service}.ts`: Domain service implementation

**src/contexts/{context}/{module}/presentation/http/:  (Presentation Layer)**
- Purpose: HTTP interface
- Contains: Controllers and HTTP-specific DTOs
- Key files:
  - `controllers/{resource}.controller.ts`: HTTP controller with routes
  - `dto/{action}.request.ts`: Request DTOs with validation
  - `dto/{resource}.response.ts`: Response DTOs

**src/shared/domain/:**
- Purpose: Shared domain abstractions
- Contains: AggregateRoot, base exceptions, base events, value objects, criteria pattern
- Key files:
  - `aggregate-root.ts`: Base class for aggregates
  - `events/domain-event.ts`: Base domain event class
  - `events/event-bus.ts`: EventBus abstract interface
  - `exceptions/`: Base exception classes (DomainException, ApplicationException)
  - `criteria/`: Query criteria pattern (Criteria, Filters, Order, Pagination)
  - `value-objects/`: Common VOs (Uuid, StringValueObject, Money, Quantity)

**src/shared/infrastructure/:**
- Purpose: Shared infrastructure implementations
- Contains: Event bus implementation, event store, file storage, database setup
- Key files:
  - `event-bus/in-memory/in-memory-nest-event-bus.ts`: EventBus implementation
  - `event-sourcing/event-store.entity.ts`: Event store table
  - `database/typeorm/migrations/`: Database schema migrations
  - `database/seeders/`: Data population scripts
  - `storage/local/local-file-storage.service.ts`: File storage impl

**src/core/:**
- Purpose: Cross-cutting concerns
- Contains: Exception filters, utility functions
- Key files:
  - `filters/global-exception.filter.ts`: Centralized exception handling
  - `utils/create-provider.ts`: Factory for registering pure use cases

**tests/:**
- Purpose: Test suites for all modules
- Contains: Unit tests, integration tests, test factories
- Key files:
  - `__mothers__/`: Object Mother pattern factories for test data
  - `{context}/{module}/application/`: Use case tests
  - `{context}/{module}/domain/`: Aggregate tests

## Key File Locations

**Entry Points:**
- `src/main.ts`: Application bootstrap
- `src/app.module.ts`: Root module with all context imports

**Configuration:**
- `src/config/app.config.ts`: App-level config
- `src/config/env/env.config.ts`: Environment variable loading
- `src/config/database/database.module.ts`: TypeORM configuration

**Core Logic (Example: Purchase Order):**
- Domain: `src/contexts/procurement/purchase-order/domain/purchase-order.ts`
- Use Case: `src/contexts/procurement/purchase-order/application/create/create-purchase-order.ts`
- CQRS: `src/contexts/procurement/purchase-order/application/create/create-purchase-order.handler.ts`
- Repository Interface: `src/contexts/procurement/purchase-order/domain/repositories/purchase-order.repository.ts`
- Repository Implementation: `src/contexts/procurement/purchase-order/infrastructure/persistence/typeorm/typeorm-purchase-order.repository.ts`
- Entity: `src/contexts/procurement/purchase-order/infrastructure/persistence/typeorm/purchase-order.entity.ts`
- Controller: `src/contexts/procurement/purchase-order/presentation/http/controllers/purchase-order.controller.ts`
- Module: `src/contexts/procurement/purchase-order/purchase-order.module.ts`

**Testing:**
- Object Mothers: `tests/contexts/procurement/purchase-order/__mothers__/`
- Use Case Tests: `tests/contexts/procurement/purchase-order/application/`

**Shared Abstractions:**
- Event Bus: `src/shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts`
- Domain Events: `src/shared/domain/events/domain-event.ts`
- Repository Interface: `src/shared/domain/repositories/` (none - defined per module)
- Value Objects: `src/shared/domain/value-objects/`
- Criteria Pattern: `src/shared/domain/criteria/`

## Naming Conventions

**Files:**
- Domain aggregates: kebab-case, no suffix → `ingredient-category.ts`
- Value objects: kebab-case, no suffix → `ingredient-category-id.ts`, `ingredient-category-name.ts`
- Use cases: kebab-case, no suffix → `create-ingredient-category.ts`
- Commands: kebab-case → `create-ingredient-category.command.ts`
- Handlers: kebab-case → `create-ingredient-category.handler.ts`
- Events: kebab-case → `ingredient-category-created.event.ts`
- Exceptions: kebab-case → `ingredient-category-not-found.exception.ts`
- Entities: PascalCase with Entity suffix → `IngredientCategoryEntity`
- Controllers: PascalCase with Controller suffix → `IngredientCategoryController`
- Services: PascalCase with Service suffix → `IngredientCategoryService`
- DTOs: PascalCase with Dto/Request/Response suffix → `CreateIngredientCategoryDto`, `IngredientCategoryResponse`

**Directories:**
- Context: kebab-case, lowercase → `inventory`, `procurement`
- Module: kebab-case, lowercase → `ingredient-category`, `purchase-order`
- Layer: lowercase, no suffix → `domain`, `application`, `infrastructure`, `presentation`
- Sublayer: lowercase → `http`, `persistence`, `typeorm`, `query-services`, `subscribers`

## Where to Add New Code

**New Feature within Existing Module:**
- Primary code: `src/contexts/{context}/{module}/application/` (use case) and `domain/` (aggregate modification)
- Tests: `tests/contexts/{context}/{module}/application/` (use case test), `tests/contexts/{context}/{module}/domain/` (aggregate test)
- HTTP endpoint: `src/contexts/{context}/{module}/presentation/http/controllers/` (add route to controller)

**New Module:**
1. Create directory: `src/contexts/{context}/{new-module}/`
2. Domain layer: Create aggregate, value objects, events, exceptions, repository interface
   - `src/contexts/{context}/{new-module}/domain/{entity}.ts`
   - `src/contexts/{context}/{new-module}/domain/{entity}-id.ts`
   - `src/contexts/{context}/{new-module}/domain/repositories/{entity}.repository.ts`
   - `src/contexts/{context}/{new-module}/domain/events/{event-name}.event.ts`
   - `src/contexts/{context}/{new-module}/domain/exceptions/{exception-name}.exception.ts`
3. Application layer: Create use cases and handlers
   - `src/contexts/{context}/{new-module}/application/{action}/{action}.ts` (use case)
   - `src/contexts/{context}/{new-module}/application/{action}/{action}.handler.ts` (handler)
   - `src/contexts/{context}/{new-module}/application/{action}/{action}.command.ts` or `.query.ts`
   - `src/contexts/{context}/{new-module}/application/dto/{resource}.response.ts`
4. Infrastructure layer: Create TypeORM entity and repository implementation
   - `src/contexts/{context}/{new-module}/infrastructure/persistence/typeorm/{entity}.entity.ts`
   - `src/contexts/{context}/{new-module}/infrastructure/persistence/typeorm/typeorm-{entity}.repository.ts`
5. Presentation layer: Create controller and request DTOs
   - `src/contexts/{context}/{new-module}/presentation/http/controllers/{resource}.controller.ts`
   - `src/contexts/{context}/{new-module}/presentation/http/dto/{action}.request.ts`
6. Module registration:
   - `src/contexts/{context}/{new-module}/{new-module}.module.ts`
   - Import in `src/app.module.ts`

**New Context:**
1. Create directory: `src/contexts/{new-context}/`
2. Create one or more modules within the context following "New Module" steps
3. Create `{new-context}.module.ts` if needed for context-level exports
4. Import modules in `src/app.module.ts` under appropriate comment section

**New Shared Value Object:**
- Location: `src/shared/domain/value-objects/{name}.ts`
- Extend: `ValueObject<T>` where T is Primitives (string, number, boolean, Date)
- Example: See `src/shared/domain/value-objects/money.ts`, `src/shared/domain/value-objects/quantity.ts`

**Event Subscriber:**
- Location: `src/contexts/{context}/{module}/application/subscribers/react-on-{event-name}.ts`
- Implement: `DomainEventSubscriber<EventType>`
- Register: In module providers array
- Pattern: Inject use case, implement `subscribedTo()` and `on(event)` methods

**Database Migration:**
```bash
name=DescriptiveName pnpm migration:generate
```
- Location: Generated in `src/shared/infrastructure/database/typeorm/migrations/`
- Auto-generated from entity changes
- Manual migrations for data transformations in same directory

**Database Seeder:**
- Location: `src/shared/infrastructure/database/seeders/`
- Pattern: Create seeder class, register in seeders array in `seed.ts`
- Run: `pnpm seed:run`

## Special Directories

**src/shared/infrastructure/database/typeorm/migrations/:**
- Purpose: Store database schema versions
- Generated: Yes (by TypeORM migration:generate)
- Committed: Yes
- Usage: Applied via `pnpm migration:run`, reverted via `pnpm migration:revert`

**src/shared/infrastructure/database/seeders/:**
- Purpose: Populate initial database data
- Generated: No (manually created)
- Committed: Yes
- Usage: Run via `pnpm seed:run` or `pnpm db:reset`

**node_modules/:**
- Purpose: Installed dependencies
- Generated: Yes (from package.json and pnpm-lock.yaml)
- Committed: No (.gitignore)

**.env files:**
- Purpose: Environment configuration
- Generated: No (template in .env.example)
- Committed: No (.gitignore)
- Location: Root directory, loaded by EnvConfigModule

---

*Structure analysis: 2026-03-17*

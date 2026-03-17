# Architecture

**Analysis Date:** 2026-03-17

## Pattern Overview

**Overall:** Onion Architecture + Domain-Driven Design (CodelyTV pragmatic style)

**Key Characteristics:**
- Strict dependency rule: Presentation → Application → Domain ← Infrastructure
- Pure domain layer (100% TypeScript, no framework decorators)
- CQRS pattern for command/query separation (when value-added)
- Event-driven architecture with domain events
- Bounded contexts organized by business subdomain
- Use cases as pure classes with `run()` method

## Layers

**Presentation:**
- Purpose: HTTP request handling, DTOs, command/query dispatch
- Location: `{module}/presentation/http/controllers/`, `{module}/presentation/http/dto/`
- Contains: Controllers, request/response DTOs, validators
- Depends on: Application layer (command/query buses, use cases)
- Used by: HTTP clients via Express/NestJS

**Application:**
- Purpose: Use cases, CQRS handlers, domain event subscribers
- Location: `{module}/application/`
- Contains: Command/Query/Handler classes, use cases, application services, DTOs
- Depends on: Domain layer (aggregates, repository interfaces, value objects), Infrastructure (EventBus, specific services)
- Used by: Presentation controllers, event subscribers

**Domain:**
- Purpose: Business logic, rules, invariants
- Location: `{module}/domain/`
- Contains: Aggregates (entities), value objects, domain events, exceptions, repository interfaces, domain services
- Depends on: Only other domain elements and shared domain abstractions
- Used by: Application layer (use cases), Infrastructure (repository implementations)

**Infrastructure:**
- Purpose: Data persistence, external service integration, event bus implementation
- Location: `{module}/infrastructure/`
- Contains: TypeORM entities, repository implementations, query services, external service clients
- Depends on: Domain layer (aggregates, repository interfaces)
- Used by: Application layer (repository injection, query service injection)

## Data Flow

**Command Flow (State Modification):**

1. HTTP request arrives at Controller (`{module}/presentation/http/controllers/`)
2. Controller deserializes DTO and creates Command object
3. Controller dispatches Command via NestJS CommandBus
4. CommandHandler receives Command and invokes pure Use Case via `run()` method
5. Use Case creates/modifies domain Aggregate (located in `{module}/domain/`)
6. Use Case calls Repository's `save()` method (abstract class in `{module}/domain/repositories/`)
7. Repository implementation (TypeORM in `{module}/infrastructure/persistence/typeorm/`) persists entity
8. Use Case pulls domain events from Aggregate and publishes via EventBus
9. EventBus distributes events to subscribers (in `{module}/application/subscribers/`) synchronously
10. Subscribers invoke other use cases as side effects
11. Response returned to HTTP client

**Query Flow (Data Retrieval):**

1. HTTP request arrives at Controller
2. Controller deserializes DTO and creates Query object
3. Controller dispatches Query via NestJS QueryBus
4. QueryHandler receives Query and invokes pure Use Case via `run()` method
5. Use Case calls QueryService's method (interface in `{module}/application/services/`, impl in `{module}/infrastructure/query-services/`)
6. QueryService returns enriched read model (joins across aggregates as needed)
7. QueryHandler returns response DTO to Controller
8. Response returned to HTTP client

**Event Flow (Async Side Effects):**

1. Aggregate records domain event internally during creation/modification
2. Use case publishes events via `eventBus.publish(aggregate.pullDomainEvents())`
3. InMemoryNestEventBus (`src/shared/infrastructure/event-bus/in-memory/`) receives events
4. EventEmitter2 emits events with `event.eventName` as key
5. Registered subscribers listen and react via `on(event)` method
6. Subscribers are injected into modules and registered at app startup
7. Subscriber invokes use case to handle side effect

**State Management:**

- Write state: Database (TypeORM) - single source of truth
- Read state: Database via QueryService with enriched data
- Domain state: Aggregates held in memory during request processing
- Event state: Domain events published after persistence ensures durability
- Subscribers execute synchronously with setImmediate to prevent blocking

## Key Abstractions

**Aggregate Root:**
- Purpose: Cluster entities with a single responsibility, enforce invariants
- Examples: `PurchaseOrder` (`src/contexts/procurement/purchase-order/domain/purchase-order.ts`), `IngredientCategory` (`src/contexts/inventory/ingredient-category/domain/ingredient-category.ts`)
- Pattern: Extends `AggregateRoot`, private constructor, factory methods (`create()`, `fromPrimitives()`), `toPrimitives()` serialization

**Value Object:**
- Purpose: Immutable domain concept (e.g., Money, Quantity, ID)
- Examples: `IngredientCategoryId`, `PurchaseOrderNumber`, `Money` (in `src/shared/domain/value-objects/`)
- Pattern: Extends `ValueObject<T>`, constructor validation, `equals()` comparison, readonly `value` field

**Repository:**
- Purpose: Abstract data persistence, decouple domain from infrastructure
- Examples: `IngredientCategoryRepository` (abstract in `src/contexts/inventory/ingredient-category/domain/repositories/`), `TypeOrmIngredientCategoryRepository` (implementation)
- Pattern: Abstract class in domain with `save()`, `search()`, `matching(criteria)` methods; TypeORM impl in infrastructure

**Domain Event:**
- Purpose: Record significant business occurrences
- Examples: `IngredientCategoryCreatedEvent` (`src/contexts/inventory/ingredient-category/domain/events/ingredient-category-created.event.ts`)
- Pattern: Extends `DomainEvent`, constructor captures data, `toPrimitives()` serialization, static EVENT_NAME

**Use Case:**
- Purpose: Orchestrate application of a business operation
- Examples: `CreateIngredientCategory` (`src/contexts/inventory/ingredient-category/application/create/create-ingredient-category.ts`)
- Pattern: Pure class (no decorators), constructor injection, async `run()` method, coordinates Repository + EventBus

**Domain Service:**
- Purpose: Business logic that doesn't fit in a single aggregate
- Examples: `PurchaseOrderValidationService` (interface in `src/contexts/procurement/purchase-order/domain/services/`)
- Pattern: Abstract class in domain, implementation in infrastructure, used by use cases

**Query Service:**
- Purpose: Retrieve and enrich read models (joins across aggregates)
- Examples: `PurchaseOrderQueryService` (interface in `src/contexts/procurement/purchase-order/application/services/`)
- Pattern: Interface in application, TypeORM impl in infrastructure, returns DTOs not aggregates

## Entry Points

**HTTP Server:**
- Location: `src/main.ts`
- Triggers: Application startup
- Responsibilities: Bootstrap NestJS, register global pipes (ValidationPipe), filters (GlobalExceptionFilter), interceptors, guards (JwtAuthGuard), configure CORS, listen on port

**AppModule:**
- Location: `src/app.module.ts`
- Triggers: NestJS initialization
- Responsibilities: Import configuration modules (EnvConfigModule, DatabaseModule), import shared infrastructure (SharedInfrastructureModule, EventBus, EventStore), import all feature modules (organized by context: IAM, Inventory, Menu, Procurement, Kitchen, SharedKernel)

**Feature Module Example (IngredientCategoryModule):**
- Location: `src/contexts/inventory/ingredient-category/ingredient-category.module.ts`
- Triggers: AppModule import
- Responsibilities: Register TypeORM entities, provide repository implementation, register use cases via `createProvider()`, register command/query handlers, export for dependent modules

**Controllers:**
- Location: `{module}/presentation/http/controllers/{resource}.controller.ts`
- Triggers: HTTP request to registered route
- Responsibilities: Deserialize DTO, dispatch Command/Query via bus, return response

## Error Handling

**Strategy:** Centralized exception filter with domain exception mapping

**Patterns:**

- **Domain Exceptions:** Extend `DomainException` in `{module}/domain/exceptions/`, thrown by aggregates and domain services, caught by `GlobalExceptionFilter` and converted to HTTP responses
- **Application Exceptions:** Extend `ApplicationException`, thrown by use cases for application-level errors
- **HTTP Exceptions:** Extend NestJS `HttpException`, thrown by validators and controllers for input validation
- **Global Filter:** `src/core/filters/global-exception.filter.ts` catches all exceptions, logs with context (method, URL, body, params), returns formatted error response with statusCode, timestamp, path, error name, message, and optional stack trace in development

## Cross-Cutting Concerns

**Logging:**
- No centralized logging library detected; console.log/console.error used in event bus and exception filter
- Should be enhanced with proper logger (e.g., Winston, Pino)

**Validation:**
- NestJS ValidationPipe with `whitelist: true, forbidNonWhitelisted: false, transform: true` globally
- DTOs decorated with class-validator decorators
- Criteria pattern DTO in `src/shared/presentation/dto/criteria.request.ts` for dynamic filtering

**Authentication:**
- JWT strategy in `src/contexts/iam/authentication/infrastructure/strategies/jwt.strategy.ts`
- Refresh token strategy in `src/contexts/iam/authentication/infrastructure/strategies/jwt-refresh.strategy.ts`
- Global JwtAuthGuard applied to all routes except those marked with `@Public()` decorator
- User context available via `@CurrentUser()` decorator

**Authorization:**
- Currently JWT-based only; no role-based access control detected
- Ready to be extended with role/permission checks

**Transactions:**
- No explicit transaction handling detected
- Each use case call is single transaction scope (implicit via TypeORM)
- Cross-aggregate transactions would need explicit implementation

---

*Architecture analysis: 2026-03-17*

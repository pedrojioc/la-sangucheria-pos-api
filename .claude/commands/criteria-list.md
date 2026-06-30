---
name: criteria-list
description: Implements a paginated criteria list for a module following the canonical query service + fromReadModel pattern
argument-hint: "<context>/<module> (e.g. procurement/purchase-order, inventory/ingredient)"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Generate ALL files needed to add a paginated criteria list to an existing module — including the TypeORM infrastructure implementation.

Follows the canonical pattern used across this codebase (purchase-order + ingredient are the references). Creates:

Application layer:
1. `application/dto/{entity}-list-item.ts` — Read Model interface (denormalized, no domain aggregates)
2. `application/dto/{entity}-list-item.response.ts` — Response DTO with static `fromReadModel()`
3. `application/dto/paginated-{entity}-list.response.ts` — Wrapper with `data[]` + `meta`
4. `application/services/{entity}-query.service.ts` — Abstract class with `search(criteria): Promise<PaginatedResult<{Entity}ListItem>>`
5. `application/search-by-criteria/search-{entities}-by-criteria.ts` — Use case
6. `application/search-by-criteria/search-{entities}-by-criteria.query.ts` — CQRS Query (carries `criteria: Criteria`)
7. `application/search-by-criteria/search-{entities}-by-criteria.handler.ts` — Handler (maps Read Model → Response, builds PaginatedResponse)
8. `presentation/http/dto/search-{entities}.request.ts` — extends CriteriaRequest (one line)

Infrastructure layer:
9. `infrastructure/query-services/typeorm-{entity}-query.service.ts` — TypeORM implementation

Then adds the GET endpoint to the existing controller.
Then registers everything in the module file (including the TypeORM binding).
</objective>

<canonical-pattern>
## Pattern rules (from engram memory + purchase-order reference)

### Read Model (`application/dto/{entity}-list-item.ts`)
- Use `interface`, not `class`
- Fields are primitives only (no domain VOs)
- Include denormalized fields (e.g., supplierName instead of just supplierId)
- Do NOT include heavy nested arrays (items, line-items) — those belong in a DetailReadModel
- File has NO imports unless referencing domain enums (e.g., PurchaseOrderStatus)

### Response DTO (`application/dto/{entity}-list-item.response.ts`)
- Use `class` with public readonly constructor params
- Static method: `static fromReadModel(item: {Entity}ListItem): {Entity}ListItemResponse`
- Only expose fields the frontend needs — can omit internal-only fields from the Read Model
- Import the list-item interface from `../dto/{entity}-list-item`

### Paginated wrapper (`application/dto/paginated-{entity}-list.response.ts`)
- Two fields: `data: {Entity}ListItemResponse[]` and `meta: PaginationMeta`
- Import PaginationMeta from `@/shared/domain/criteria/paginated-result`
- Import the response DTO from `./...`

### Query Service (`application/services/{entity}-query.service.ts`)
- `export abstract class {Entity}QueryService`
- Single method: `abstract search(criteria: Criteria): Promise<PaginatedResult<{Entity}ListItem>>`
- Import Criteria from `@/shared/domain/criteria/criteria`
- Import PaginatedResult from `@/shared/domain/criteria/paginated-result`
- Import the list-item from `../dto/{entity}-list-item`

### Use case (`application/search-by-criteria/search-{entities}-by-criteria.ts`)
- Pure class: NO `@Injectable()`, NO `@Inject()`
- Constructor receives `{Entity}QueryService` (the abstract class)
- Single method: `run(criteria: Criteria): Promise<PaginatedResult<{Entity}ListItem>>`
- Body is one line: `return this.queryService.search(criteria)`

### CQRS Query (`application/search-by-criteria/search-{entities}-by-criteria.query.ts`)
- `export class Search{Entities}ByCriteriaQuery { constructor(public readonly criteria: Criteria) {} }`

### Handler (`application/search-by-criteria/search-{entities}-by-criteria.handler.ts`)
- Decorator: `@QueryHandler(Search{Entities}ByCriteriaQuery)`
- Implements `IQueryHandler<Search{Entities}ByCriteriaQuery>`
- Constructor receives use case instance
- `execute()` calls `useCase.run(query.criteria)`, maps with `fromReadModel()`, returns `new Paginated{Entity}ListResponse(data, result.meta)`

### Request DTO (`presentation/http/dto/search-{entities}.request.ts`)
- One line class body: `export class Search{Entities}Request extends CriteriaRequest {}`
- Import from `@/shared/presentation/dto/criteria.request`

### Controller endpoint
```typescript
@Get()
async search(@Query() dto: Search{Entities}Request): Promise<Paginated{Entity}ListResponse> {
  const criteria = dto.toCriteria()
  const query = new Search{Entities}ByCriteriaQuery(criteria)
  return this.queryBus.execute(query)
}
```

### TypeORM Query Service (`infrastructure/query-services/typeorm-{entity}-query.service.ts`)

There are two implementation styles in the codebase — choose based on whether any Read Model fields come from JOINed tables:

**Style A — `TypeOrmCriteriaConverter` (use when all filterable fields belong to the main entity)**
Reference: `src/contexts/inventory/ingredient/infrastructure/query-services/typeorm-ingredient-query.service.ts`

```typescript
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { TypeOrmCriteriaConverter } from '@/shared/infrastructure/persistence/typeorm/typeorm-criteria-converter'
import { {Entity}QueryService } from '../../application/services/{entity}-query.service'
import { {Entity}ListItem } from '../../application/dto/{entity}-list-item'
import { {Entity}Entity } from '../persistence/typeorm/{entity}.entity'

@Injectable()
export class TypeOrm{Entity}QueryService implements {Entity}QueryService {
  constructor(
    @InjectRepository({Entity}Entity)
    private readonly repository: Repository<{Entity}Entity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<{Entity}ListItem>> {
    const converter = new TypeOrmCriteriaConverter<{Entity}Entity>()
    let qb = this.repository.createQueryBuilder('{entityAlias}')
    // Add LEFT JOINs here if needed for denormalized fields (but don't filter by them)
    // qb.leftJoinAndSelect('{entityAlias}.relation', 'relation')
    qb = converter.convert(qb, criteria, '{entityAlias}')
    const [entities, total] = await qb.getManyAndCount()

    const items: {Entity}ListItem[] = entities.map(e => ({
      // map entity fields to Read Model
    }))

    return PaginatedResult.create(items, total, criteria.pagination.page, criteria.pagination.pageSize)
  }
}
```

**Style B — Manual QueryBuilder (use when JOINed fields are filterable, e.g., supplierName)**
Reference: `src/contexts/procurement/purchase-order/infrastructure/query-services/typeorm-purchase-order-query.service.ts`

Key differences from Style A:
- `@Injectable()` is present
- Uses `createQueryBuilder` manually with explicit `.select([...])` to control which columns load
- `applyFilters()` private method handles each FilterOperator with a `columnMap` for the main alias, plus special-case handlers for each JOINed field
- `applyOrdering()` private method with `columnMap` + special cases for JOINed fields
- Gets total with `qb.getCount()` BEFORE calling `.skip().take()`, then `qb.getMany()` — NOT `getManyAndCount()`
- Casts enums explicitly: `entity.status as {Entity}Status`
- Casts decimal columns: `Number(entity.decimalField)`

### Module registration
- Register the TypeORM query service as a provider: `{ provide: {Entity}QueryService, useClass: TypeOrm{Entity}QueryService }`
- Register the use case with `createProvider(Search{Entities}ByCriteria, [{Entity}QueryService])`
- Register the handler in the `QueryHandlers` array or equivalent
</canonical-pattern>

<process>
## Step 1 — Parse the argument

The argument is `$ARGUMENTS`.

Extract:
- `context`: first path segment (e.g., `procurement`)
- `module`: second path segment (e.g., `purchase-order`)
- `modulePath`: `src/contexts/{context}/{module}/`

If the argument is empty or malformed, ask the user: "Which module? (e.g., procurement/purchase-order)"

## Step 2 — Read the target module

Read these files to understand the module's domain model and existing structure:

1. List all files: `find src/contexts/{context}/{module} -type f | sort`
2. Read the main aggregate file (usually `domain/{entity}.ts`) to know the fields
3. Read the existing controller to understand current endpoints and imports
4. Read the module file (`.module.ts`) to understand how providers are registered

Also read the reference files to stay aligned with the pattern:
- `src/contexts/procurement/purchase-order/application/dto/purchase-order-list-item.ts`
- `src/contexts/procurement/purchase-order/application/dto/purchase-order-list-item.response.ts`
- `src/contexts/procurement/purchase-order/application/services/purchase-order-query.service.ts`
- `src/contexts/procurement/purchase-order/application/search-by-criteria/search-purchase-orders-by-criteria.ts`

## Step 3 — Derive naming

From the module name, derive:
- `Entity` (PascalCase singular): e.g., `purchase-order` → `PurchaseOrder`
- `entity` (camelCase singular): e.g., `purchaseOrder`
- `entities` (camelCase plural): e.g., `purchaseOrders`
- `Entities` (PascalCase plural): e.g., `PurchaseOrders`
- File prefix (kebab singular): e.g., `purchase-order`
- File prefix plural (kebab): e.g., `purchase-orders`

## Step 4 — Analyze the aggregate

From the aggregate's domain fields, decide which fields belong in the Read Model:
- Include: all scalar fields the list view needs, denormalized names (join by ID → show name)
- Omit: embedded collections (items, line items) unless small and always needed
- For each FK (e.g., `supplierId`), add both `supplierId` and `supplierName` (denormalized)

Present the proposed Read Model fields to the user before writing code. Ask if they want to add/remove fields or change anything.

## Step 5 — Write the files

Write all 8 files following the canonical pattern above.
Follow the exact import paths and coding style of the reference module.
No comments in generated code unless the field is non-obvious.
No `@Injectable()` or `@Inject()` on use cases.

## Step 6 — Update the controller

Edit the existing controller file:
- Add the import for `Search{Entities}Request` (presentation DTO)
- Add the import for `Search{Entities}ByCriteriaQuery` (application query)
- Add the import for `Paginated{Entity}ListResponse` (application DTO)
- Add the `QueryBus` to the constructor if not already present
- Add the `@Get()` endpoint following the canonical pattern

## Step 7 — Plan the TypeORM implementation

Before writing the query service, analyze the Read Model fields decided in Step 4 and determine:

1. **Which fields come from JOINed tables?** (e.g., `supplierName` from a `supplier` relation)
   - If none → use Style A (`TypeOrmCriteriaConverter`)
   - If yes → use Style B (manual QueryBuilder)

2. **Which relations need LEFT JOIN?** List them (e.g., `po.supplier → supplier`, `po.category → category`)

3. **Which fields are filterable?** Build the `columnMap` (main alias columns) and list any JOINed fields that need special filter handling.

4. **Which fields are numeric/decimal in the DB?** Those need `Number(entity.field)` when mapping to the Read Model.

5. **What is the default sort field and direction?** (e.g., `createdAt DESC`, `name ASC`)

Present this plan as a short summary before writing. No need to ask for approval — proceed immediately after presenting.

## Step 8 — Write the TypeORM query service

Read the existing TypeORM entity file (`infrastructure/persistence/typeorm/{entity}.entity.ts`) to verify exact column names and relation property names before writing.

Write `infrastructure/query-services/typeorm-{entity}-query.service.ts` following the chosen style:

- **Style A**: Use `TypeOrmCriteriaConverter`. Add `leftJoinAndSelect` for any relations needed for denormalized fields. Map `entities` array to `{Entity}ListItem[]`. Use `getManyAndCount()`.
- **Style B**: Explicit `.select([...])`, `applyFilters()` + `applyOrdering()` private methods with `columnMap`, special handlers for each JOINed filterable field. Use `getCount()` then `getMany()` separately.

In both styles:
- Decorate with `@Injectable()`
- Cast enum fields: `entity.status as {Entity}Status`
- Cast decimal/numeric DB columns: `Number(entity.field)`
- Use `PaginatedResult.create(items, total, criteria.pagination.page, criteria.pagination.pageSize)`

## Step 9 — Update the module

Edit the `.module.ts` file:
- Import `TypeOrm{Entity}QueryService`
- Add it to the entity imports if not already present (`TypeOrmModule.forFeature([..., {Entity}Entity])`)
- Register the binding: `{ provide: {Entity}QueryService, useClass: TypeOrm{Entity}QueryService }`
- Register the use case with `createProvider(Search{Entities}ByCriteria, [{Entity}QueryService])`
- Register the handler in the `QueryHandlers` array or equivalent

## Step 10 — Verify

Run `pnpm tsc --noEmit 2>&1 | head -40` to check for type errors.
Fix any errors before reporting done.

## Step 11 — Report

List all files created/modified with their paths (application layer + infra layer + controller + module).
</process>

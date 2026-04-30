# CQRS Read Models Strategy

**Version:** 1.0.0
**Date:** 2026-01-22
**Status:** Discussed - Option C Implemented

---

## Context

When implementing CQRS (Command Query Responsibility Segregation), a common challenge arises: how to handle read operations that require data from multiple aggregates (e.g., `PurchaseOrder` needs `Supplier.name` for display).

### The Problem

```
┌─────────────────────┐         ┌─────────────────────┐
│   PurchaseOrder     │         │      Supplier       │
│   (Aggregate)       │         │    (Aggregate)      │
├─────────────────────┤         ├─────────────────────┤
│   supplierId ───────┼────────►│   id                │
│                     │         │   name              │
│   ❌ supplierName?  │         │   contactName       │
└─────────────────────┘         └─────────────────────┘

Write: Only need supplierId ✅
Read:  Need supplierId + supplierName 🤔
```

### DDD Principle

Aggregates reference each other **only by ID**. The domain aggregate should NOT contain data from other aggregates (like `supplierName`).

---

## Solutions Analyzed

### Option A: Separate Read Repository (Purest DDD) ✅

The read repository **belongs to the Application Layer**, not Domain.

**Structure:**

```
purchase-order/
├── domain/
│   ├── purchase-order.ts
│   └── repositories/
│       └── purchase-order.repository.ts    ← Write only
│
├── application/
│   ├── dto/
│   │   ├── purchase-order-list-item.ts     ← Read model
│   │   └── purchase-order-detail.ts        ← Detailed read model
│   │
│   ├── repositories/                        ← NEW: Read repo interface
│   │   └── purchase-order-read.repository.ts
│   │
│   └── search-by-criteria/
│       └── search-purchase-orders-by-criteria.ts
│
└── infrastructure/
    └── persistence/
        └── typeorm/
            ├── typeorm-purchase-order.repository.ts       ← Implements domain
            └── typeorm-purchase-order-read.repository.ts  ← Implements application
```

**Domain Repository (Write Only):**

```typescript
// domain/repositories/purchase-order.repository.ts

export abstract class PurchaseOrderRepository {
  abstract save(order: PurchaseOrder): Promise<void>
  abstract findById(id: PurchaseOrderId): Promise<PurchaseOrder | null>
  abstract findByOrderNumber(orderNumber: string): Promise<PurchaseOrder | null>
  abstract getNextSequenceNumber(): Promise<number>
  // ❌ NO search() with read models
}
```

**Application Read Repository:**

```typescript
// application/repositories/purchase-order-read.repository.ts

import { Criteria } from '@/shared/domain/criteria/criteria'
import { PaginatedResult } from '@/shared/domain/criteria/paginated-result'
import { PurchaseOrderListItem } from '../dto/purchase-order-list-item'
import { PurchaseOrderDetail } from '../dto/purchase-order-detail'

export abstract class PurchaseOrderReadRepository {
  abstract search(criteria: Criteria): Promise<PaginatedResult<PurchaseOrderListItem>>
  abstract findDetailById(id: string): Promise<PurchaseOrderDetail | null>
}
```

**Use Case:**

```typescript
// application/search-by-criteria/search-purchase-orders-by-criteria.ts

export class SearchPurchaseOrdersByCriteria {
  constructor(
    private readonly readRepository: PurchaseOrderReadRepository
  ) {}

  async run(criteria: Criteria): Promise<PaginatedResult<PurchaseOrderListItem>> {
    return this.readRepository.search(criteria)
  }
}
```

**Pros:**
- Purest DDD approach
- Clear separation between read and write models
- Read repository can be optimized independently

**Cons:**
- More files/interfaces to maintain
- Slightly more complex structure

---

### Option B: Enrich in Handler (Pragmatic)

Domain repository returns aggregates, handler enriches with additional data.

```typescript
// domain/repositories/purchase-order.repository.ts

export abstract class PurchaseOrderRepository {
  abstract save(order: PurchaseOrder): Promise<void>
  abstract findById(id: PurchaseOrderId): Promise<PurchaseOrder | null>
  abstract matching(criteria: Criteria): Promise<PaginatedResult<PurchaseOrder>>
}
```

```typescript
// application/search-by-criteria/search-purchase-orders-by-criteria.handler.ts

@QueryHandler(SearchPurchaseOrdersByCriteriaQuery)
export class SearchPurchaseOrdersByCriteriaHandler {
  constructor(
    private readonly repository: PurchaseOrderRepository,
    private readonly supplierRepository: SupplierRepository
  ) {}

  async execute(query: SearchPurchaseOrdersByCriteriaQuery) {
    const result = await this.repository.matching(query.criteria)

    // Enrich with supplier data
    const supplierIds = [...new Set(result.data.map(o => o.toPrimitives().supplierId))]
    const suppliers = await this.supplierRepository.findByIds(supplierIds)
    const supplierMap = new Map(suppliers.map(s => [s.id.value, s]))

    // Transform to DTOs
    const items = result.data.map(order => {
      const primitives = order.toPrimitives()
      const supplier = supplierMap.get(primitives.supplierId)

      return {
        ...primitives,
        supplierName: supplier?.toPrimitives().name ?? 'Unknown'
      }
    })

    return { data: items, meta: result.meta }
  }
}
```

**Pros:**
- Simpler structure
- Domain repository stays pure

**Cons:**
- Potential N+1 queries
- Additional queries to enrich data
- Less performant for large datasets

---

### Option C: Query Service in Application (Recommended) ✅✅

A dedicated service for complex queries that lives in application layer.

**Structure:**

```
purchase-order/
├── domain/
│   ├── purchase-order.ts                    ← Pure aggregate
│   └── repositories/
│       └── purchase-order.repository.ts     ← WRITE operations only
│
├── application/
│   ├── dto/
│   │   ├── purchase-order-list-item.ts      ← Read model for lists
│   │   └── purchase-order-detail.ts         ← Read model for detail
│   │
│   ├── services/
│   │   └── purchase-order-query.service.ts  ← Abstract query service
│   │
│   ├── create/                              ← Command (uses domain repo)
│   ├── approve/                             ← Command (uses domain repo)
│   │
│   └── search-by-criteria/
│       └── search-purchase-orders.ts        ← Query (uses query service)
│
└── infrastructure/
    ├── persistence/
    │   └── typeorm/
    │       └── typeorm-purchase-order.repository.ts  ← Implements domain repo
    │
    └── query-services/
        └── typeorm-purchase-order-query.service.ts   ← Implements query service
```

**Abstract Query Service:**

```typescript
// application/services/purchase-order-query.service.ts

export abstract class PurchaseOrderQueryService {
  abstract search(criteria: Criteria): Promise<PaginatedResult<PurchaseOrderListItem>>
  abstract findDetail(id: string): Promise<PurchaseOrderDetail | null>
}
```

**Infrastructure Implementation:**

```typescript
// infrastructure/query-services/typeorm-purchase-order-query.service.ts

@Injectable()
export class TypeOrmPurchaseOrderQueryService implements PurchaseOrderQueryService {
  constructor(
    @InjectRepository(PurchaseOrderEntity)
    private readonly repository: Repository<PurchaseOrderEntity>
  ) {}

  async search(criteria: Criteria): Promise<PaginatedResult<PurchaseOrderListItem>> {
    const qb = this.repository.createQueryBuilder('po')
      .leftJoin('suppliers', 's', 'po.supplier_id = s.id')
      .select([
        'po.id as id',
        'po.order_number as "orderNumber"',
        's.name as "supplierName"',
        // ... optimized fields for listing
      ])

    // Apply criteria, pagination...

    return PaginatedResult.create(results, total, page, pageSize)
  }
}
```

**Pros:**
- Clean separation of concerns
- Optimal performance (single query with JOINs)
- Semantically clear ("Query Service" for reads)
- Domain layer stays pure

**Cons:**
- Additional service to maintain
- Slightly more files than Option B

---

## Comparison Matrix

| Aspect | Option A (Read Repo) | Option B (Enrich) | Option C (Query Service) |
|--------|---------------------|-------------------|-------------------------|
| **DDD Purity** | ✅ Highest | ✅ Good | ✅ Good |
| **Performance** | ✅ Optimal (1 query) | ⚠️ N+1 potential | ✅ Optimal (1 query) |
| **Complexity** | Medium | Low | Low-Medium |
| **Semantics** | "Read Repository" | "Handler enriches" | "Query Service" |
| **Maintenance** | More interfaces | Simpler | Balanced |

---

## Architecture Principle

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│   DOMAIN LAYER (innermost)                                  │
│   - PurchaseOrder (aggregate)                               │
│   - PurchaseOrderRepository (write operations only)         │
│   - NO read models, NO DTOs knowledge                       │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   APPLICATION LAYER                                         │
│   - PurchaseOrderQueryService (abstract - for reads)        │
│   - PurchaseOrderListItem, PurchaseOrderDetail (DTOs)       │
│   - Commands use → Domain Repository                        │
│   - Queries use → Query Service                             │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   INFRASTRUCTURE LAYER (outermost)                          │
│   - TypeOrmPurchaseOrderRepository (implements domain)      │
│   - TypeOrmPurchaseOrderQueryService (implements app)       │
│   - JOINs and SQL optimizations live here                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Decision

**Implemented:** Option C (Query Service)

**Rationale:**
1. Clean separation between write (domain repo) and read (query service)
2. Optimal performance with single query and JOINs
3. Semantically clear naming convention
4. Domain layer remains pure without read model knowledge
5. Good balance between purity and pragmatism

**Future consideration:** If read complexity grows significantly, consider migrating to Option A for even clearer separation.

---

## Related Documents

- [CLAUDE.md](../../CLAUDE.md) - Main architecture guidelines
- [API-DESIGN-DECISIONS.md](../../API-DESIGN-DECISIONS.md) - API design patterns

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-22 | Initial discussion and Option C implementation |

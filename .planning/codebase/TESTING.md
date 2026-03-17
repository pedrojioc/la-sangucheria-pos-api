# Testing Patterns

**Analysis Date:** 2026-03-17

## Test Framework

**Runner:**
- Jest 29.7.0
- Config: `jest.config.js` at project root
- Transform: TypeScript via ts-jest 29.2.5
- Test environment: node

**Assertion Library:**
- Jest built-in matchers (`expect()`)

**Run Commands:**
```bash
pnpm test              # Run all tests once
pnpm test:watch        # Run tests in watch mode
pnpm test:cov          # Run tests with coverage report
pnpm test:debug        # Run tests with Node debugger
pnpm test:e2e          # Run e2e tests (jest config: test/jest-e2e.json)
```

## Test File Organization

**Location:**
- Co-located with source (not separate test directory structure)
- **Directory:** `tests/contexts/{context}/{module}/{layer}/`
- Examples:
  - `tests/contexts/procurement/purchase-order/application/CreatePurchaseOrder.spec.ts`
  - `tests/contexts/procurement/purchase-order/domain/PurchaseOrder.spec.ts`
  - `tests/contexts/procurement/purchase-order/infrastructure/TypeOrmPurchaseOrderRepository.spec.ts`

**Naming:**
- PascalCase: `CreatePurchaseOrder.spec.ts` (matches class being tested)
- Suffix: `.spec.ts` (not `.test.ts`)
- Test mothers: `__mothers__/` subdirectory with PascalCase names: `PurchaseOrderMother.ts`, `UuidMother.ts`

**Structure:**
```
tests/
  contexts/
    {context}/
      {module}/
        __mothers__/
          PurchaseOrderMother.ts
          PurchaseOrderItemMother.ts
          PurchaseOrderNumberMother.ts
        application/
          CreatePurchaseOrder.spec.ts
          ApprovePurchaseOrder.spec.ts
        domain/
          PurchaseOrder.spec.ts
        infrastructure/
          TypeOrmPurchaseOrderRepository.spec.ts
  shared/
    __mothers__/
      UuidMother.ts
      StringMother.ts
      NumberMother.ts
      BooleanMother.ts
```

## Test Structure

**Suite Organization:**

Use nested `describe()` blocks for grouped test cases. Arrange-Act-Assert (AAA) pattern in each test.

```typescript
describe('PurchaseOrder', () => {
  describe('create', () => {
    it('should create a new purchase order in DRAFT status with items', () => {
      // Arrange
      const id = UuidMother.random()
      const items = PurchaseOrderItemMother.createPrimitives(2)

      // Act
      const purchaseOrder = PurchaseOrder.create(id, ..., items)

      // Assert
      const primitives = purchaseOrder.toPrimitives()
      expect(primitives.id).toBe(id)
      expect(primitives.status).toBe(PurchaseOrderStatus.DRAFT)
      expect(primitives.items).toHaveLength(2)
    })
  })

  describe('approve', () => {
    it('should transition from PENDING_APPROVAL to APPROVED', () => {
      // Arrange
      const purchaseOrder = PurchaseOrderMother.pendingApproval()

      // Act
      purchaseOrder.approve(UuidMother.random())

      // Assert
      expect(purchaseOrder.toPrimitives().status).toBe(PurchaseOrderStatus.APPROVED)
    })
  })
})
```

**Patterns:**

1. **Setup (beforeEach):** Initialize mocks and use case instances
```typescript
beforeEach(() => {
  repository = {
    save: jest.fn(),
    findById: jest.fn(),
    findByOrderNumber: jest.fn(),
    // ... other methods
  } as any

  eventBus = {
    publish: jest.fn()
  } as any

  useCase = new CreatePurchaseOrder(repository, validationService, eventBus)
})
```

2. **Teardown (afterAll for integration tests):** Close database connections
```typescript
afterAll(async () => {
  await module.close()
})
```

3. **Assertion helpers:**
- `expect(value).toBe(expected)` - exact equality
- `expect(value).toHaveLength(n)` - array length
- `expect(fn).toHaveBeenCalledTimes(n)` - mock call count
- `expect(fn).toHaveBeenCalledWith(args)` - mock call arguments
- `await expect(promise).rejects.toThrow(ExceptionClass)` - async errors
- `expect(value).toBeInstanceOf(Class)` - type checking
- `expect(value).toBeGreaterThan(n)` - numeric comparisons

## Mocking

**Framework:** Jest built-in mocking (`jest.fn()`, `jest.mocked<T>()`)

**Patterns:**

1. **Mock repositories** for unit tests of use cases/services:
```typescript
repository = {
  save: jest.fn(),
  findById: jest.fn().mockResolvedValue(purchaseOrder),
  findByOrderNumber: jest.fn(),
  findByStatus: jest.fn(),
  findAll: jest.fn(),
  getNextSequenceNumber: jest.fn().mockResolvedValue(1),
  matching: jest.fn()
} as any
```

2. **Mock event bus** for testing event publishing:
```typescript
eventBus = {
  publish: jest.fn()
} as any

// Later: verify publishing
expect(eventBus.publish).toHaveBeenCalledTimes(1)
const events = eventBus.publish.mock.calls[0][0]
expect(events[0].eventName).toBe('procurement.purchase_order.created')
```

3. **Real database** for integration tests of repositories:
```typescript
const module = await Test.createTestingModule({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [PurchaseOrderEntity, PurchaseOrderItemEntity],
      synchronize: true
    }),
    TypeOrmModule.forFeature([PurchaseOrderEntity, PurchaseOrderItemEntity])
  ],
  providers: [TypeOrmPurchaseOrderRepository]
}).compile()
```

**What to Mock:**
- Repository methods (unit tests of use cases)
- Event bus (unit tests of use cases)
- External services (when testing application layer)
- HTTP clients (when testing external integrations)

**What NOT to Mock:**
- Domain aggregate methods (test them directly)
- Value objects (test them directly)
- Repository implementations (use real database in integration tests)

## Fixtures and Factories

**Test Data Pattern - Object Mother:**

Create reusable factory builders with sensible defaults and customization options.

```typescript
export class UuidMother {
  static random(): string {
    return faker.string.uuid()
  }

  static create(value: string): string {
    return value
  }
}

export class PurchaseOrderMother {
  static create(params: Partial<PurchaseOrderPrimitives> = {}): PurchaseOrder {
    const defaultItems = params.items ?? [
      PurchaseOrderItemMother.random().toPrimitives(),
      PurchaseOrderItemMother.random().toPrimitives()
    ]

    const totalAmount = params.totalAmount ?? defaultItems.reduce((sum, item) => sum + item.totalCost, 0)

    const primitives: PurchaseOrderPrimitives = {
      id: params.id ?? UuidMother.random(),
      orderNumber: params.orderNumber ?? PurchaseOrderNumberMother.random(),
      status: params.status ?? PurchaseOrderStatus.DRAFT,
      items: defaultItems,
      // ... other fields with defaults
    }

    return PurchaseOrder.fromPrimitives(primitives)
  }

  static random(): PurchaseOrder {
    return this.create()
  }

  static inDraft(): PurchaseOrder {
    return this.create({ status: PurchaseOrderStatus.DRAFT })
  }

  static pendingApproval(): PurchaseOrder {
    return this.create({ status: PurchaseOrderStatus.PENDING_APPROVAL })
  }

  static approved(): PurchaseOrder {
    return this.create({
      status: PurchaseOrderStatus.APPROVED,
      approvedBy: UuidMother.random(),
      approvedDate: new Date()
    })
  }
}
```

**Location:**
- `tests/shared/__mothers__/` for shared mothers (UuidMother, StringMother, etc.)
- `tests/contexts/{context}/{module}/__mothers__/` for domain-specific mothers (PurchaseOrderMother, etc.)

**Usage in tests:**
```typescript
const purchaseOrder = PurchaseOrderMother.pendingApproval()
const items = PurchaseOrderItemMother.createPrimitives(2)
const id = UuidMother.random()
```

## Coverage

**Requirements:** None explicitly enforced, but coverage reporting is configured

**View Coverage:**
```bash
pnpm test:cov
```

**Configuration:**
- Collected from: `src/**/*.(t|j)s`
- Excluded from collection:
  - `src/main.ts` (entry point)
  - `src/**/*.module.ts` (NestJS boilerplate)
  - `.entity.ts` files (database entities)
  - `.dto.ts` files (transfer objects)
- Coverage report generated to: `./coverage` directory

## Test Types

**Unit Tests:**
- **Scope:** Individual classes (use cases, aggregates, value objects)
- **Setup:** Mocked dependencies (repositories, services)
- **Approach:** Fast, focused on business logic
- **Example:** `CreatePurchaseOrder.spec.ts` - tests use case without database
- **Files:** `application/*.spec.ts`, `domain/*.spec.ts`

**Integration Tests:**
- **Scope:** Class + real dependencies (e.g., repository + database)
- **Setup:** TestingModule with TypeORM in-memory database
- **Approach:** Slower but catches interaction bugs
- **Example:** `TypeOrmPurchaseOrderRepository.spec.ts` - tests repository with real SQLite db
- **Files:** `infrastructure/*.spec.ts`

**E2E Tests:**
- **Framework:** Not detected in codebase (jest-e2e config exists but no tests found)
- **Convention:** Would use Supertest for HTTP testing if implemented
- **Config:** `test/jest-e2e.json`

## Common Patterns

**Async Testing:**
```typescript
it('should create a purchase order', async () => {
  // Use case.run() returns Promise<void>
  await useCase.run(id, supplierId, requestedBy, 'PEN', null, null, items)

  // Verify repository was called
  expect(repository.save).toHaveBeenCalledTimes(1)
})

it('should throw error when purchase order not found', async () => {
  repository.findById.mockResolvedValue(null)

  // Expect promise rejection
  await expect(
    useCase.run(UuidMother.random(), UuidMother.random())
  ).rejects.toThrow('not found')
})
```

**Error Testing:**
```typescript
it('should throw error when approving from invalid status', async () => {
  const purchaseOrder = PurchaseOrderMother.inDraft()
  repository.findById.mockResolvedValue(purchaseOrder)

  await expect(
    useCase.run(purchaseOrder.toPrimitives().id, UuidMother.random())
  ).rejects.toThrow(InvalidStatusTransition)
})
```

**Event Testing:**
```typescript
it('should publish PurchaseOrderCreatedEvent with items info', async () => {
  const items = PurchaseOrderItemMother.createPrimitives(2)

  await useCase.run(
    UuidMother.random(),
    UuidMother.random(),
    UuidMother.random(),
    'PEN',
    null,
    null,
    items
  )

  expect(eventBus.publish).toHaveBeenCalledTimes(1)
  const events = eventBus.publish.mock.calls[0][0]
  expect(events).toHaveLength(1)
  expect(events[0].eventName).toBe('procurement.purchase_order.created')
})
```

**Domain State Testing:**
```typescript
it('should add items to order in DRAFT status', () => {
  const purchaseOrder = PurchaseOrderMother.withoutItems()
  const item = PurchaseOrderItem.create(
    UuidMother.random(),
    UuidMother.random(),
    10,
    UuidMother.random(),
    15.5,
    'PEN',
    null
  )

  purchaseOrder.addItems([item])

  const primitives = purchaseOrder.toPrimitives()
  expect(primitives.items).toHaveLength(1)
})
```

## Best Practices

1. **Use Object Mothers for test data:** Always use mothers to create test entities, never inline literal objects
2. **Mock at boundaries:** Mock external dependencies (repositories, services), test logic directly
3. **One assertion focus per test:** Each test should verify one behavior (though setup verification is ok)
4. **Descriptive test names:** Names should explain the scenario and expected outcome
5. **AAA pattern:** Always separate Arrange, Act, Assert sections clearly
6. **No test interdependence:** Each test must be runnable independently
7. **Use real databases for integration tests:** SQLite in-memory is fast and reliable

---

*Testing analysis: 2026-03-17*

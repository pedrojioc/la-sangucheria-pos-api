# Codebase Concerns

**Analysis Date:** 2026-03-17

## Tech Debt

### PurchaseOrder Aggregate Size (785 lines)
- **Issue:** `PurchaseOrder.ts` contains extensive state management and status transitions in a single aggregate, exceeding recommended limits.
- **Files:** `src/contexts/procurement/purchase-order/domain/purchase-order.ts`
- **Impact:** Difficult to maintain, test, and understand. Risk of introducing subtle bugs during modifications. Complex status transition logic (DRAFT → PENDING_APPROVAL → APPROVED → PARTIALLY_RECEIVED → CLOSED) harder to track across such a large file.
- **Fix approach:** Consider splitting into smaller aggregates or using a state machine pattern. Extract complex logic (status transitions, item management) into domain services.

### Incomplete Validations in CreatePurchaseOrder
- **Issue:** Critical validations are marked as TODO but never executed.
- **Files:** `src/contexts/procurement/purchase-order/application/create/create-purchase-order.ts` (lines 51-52)
- **Impact:** Purchase orders can be created with non-existent suppliers or units. Data integrity cannot be guaranteed at creation time. May cause failures downstream when processing items.
- **Fix approach:** Implement `validateSupplierExists()` and `validateUnitsExist()` in `TypeormPurchaseOrderValidationService`. Add tests to verify validation gates.

### Incomplete Validation Service
- **Issue:** Two critical validation methods are stubs with TODO comments.
- **Files:** `src/contexts/procurement/purchase-order/infrastructure/query-services/typeorm-purchase-order-validation.service.ts` (lines 38-64)
- **Impact:** `validateSupplierExists()` and `validateUnitsExist()` never validate anything. Supplier references and unit references cannot be verified, allowing orphaned references.
- **Fix approach:** Uncomment and implement the validation logic. Inject required repositories (SupplierEntity, UnitEntity). Add proper error handling.

### SendPurchaseOrder Use Case Deprecated
- **Issue:** `SendPurchaseOrder` is disabled entirely with a thrown error. The SENT status was removed from domain model but the use case still exists.
- **Files:** `src/contexts/procurement/purchase-order/application/send/send-purchase-order.ts` (lines 9-44)
- **Impact:** Confusing API - endpoint exists but throws error at runtime. Unclear to consumers whether they should use this or another method. Three options proposed but not decided.
- **Fix approach:** (1) Remove the use case and endpoint entirely, (2) Implement with `registerPurchaseMethod()` domain method, or (3) Merge functionality into `ApprovePurchaseOrder`. Decision needed before next release.

### Missing OverstockDetected Event
- **Issue:** Overstock detection logic is incomplete; event emission is marked as TODO.
- **Files:** `src/contexts/inventory/stock-level/domain/inventory-level.ts` (line 75)
- **Impact:** No alerts when inventory exceeds maximum levels. Business cannot detect problematic overstocking situations. Asymmetric with low-stock detection which works.
- **Fix approach:** Implement `checkAndEmitStockEvents()` to emit `OverstockDetectedEvent` when `currentQuantity > maximumQuantity`. Add thresholds if needed.

### Hard-coded User IDs Instead of UserId Value Objects
- **Issue:** PurchaseOrder stores requestedBy, approvedBy, rejectedBy, sentBy, closedBy as raw strings.
- **Files:** `src/contexts/procurement/purchase-order/domain/purchase-order.ts` (line 105)
- **Impact:** Type safety is lost for user references. Cannot validate that user IDs are properly formatted. Will break if user ID format changes. Makes tracking user actions less reliable.
- **Fix approach:** Create a `UserId` value object (similar to `PurchaseOrderId`, `SupplierId`). Replace string references with `UserId` instances. Update constructor and all related methods.

### Hard-coded Role in UserResponse DTO
- **Issue:** Role is hard-coded to 'ADMIN' instead of fetching from actual user data.
- **Files:** `src/contexts/iam/user/application/dto/user.response.ts` (line 47)
- **Impact:** All users appear as ADMIN regardless of actual role. Security risk - authorization checks that depend on user.response.role will be incorrect. Role-based access control cannot function properly.
- **Fix approach:** Implement actual role system. Add role field to User aggregate. Fetch role from user.toPrimitives() instead of hard-coding.

## Known Bugs

### Missing Supplier Validation in CreatePurchaseOrder
- **Symptoms:** Purchase orders can reference non-existent suppliers without error.
- **Files:** `src/contexts/procurement/purchase-order/application/create/create-purchase-order.ts` (line 51)
- **Trigger:** Call CreatePurchaseOrder.run() with an invalid supplierId that doesn't exist in suppliers table.
- **Workaround:** Validate supplier existence in the HTTP controller before calling use case (not ideal, should be in domain).

### Missing Unit Validation in CreatePurchaseOrder
- **Symptoms:** Purchase order items can reference non-existent units without error.
- **Files:** `src/contexts/procurement/purchase-order/application/create/create-purchase-order.ts` (line 52)
- **Trigger:** Call CreatePurchaseOrder.run() with invalid unitIds in order items.
- **Workaround:** None - users must ensure units exist beforehand.

### Unit Conversion Service May Fail Silently
- **Symptoms:** `ConvertQuantity` fetches ALL conversion rules instead of the specific one needed.
- **Files:** `src/contexts/shared-kernel/unit-conversion/application/convert-quantity/convert-quantity.ts` (line 23-24)
- **Trigger:** Call ConvertQuantity.run() when conversion rule doesn't exist.
- **Workaround:** Ensure conversion rules are created before attempting conversions. No error message if rule is missing.

## Security Considerations

### Role-Based Access Control Broken
- **Risk:** Users cannot be assigned different roles; all respond with 'ADMIN' role. Authorization checks will fail or allow unauthorized access.
- **Files:** `src/contexts/iam/user/application/dto/user.response.ts` (line 47), `src/contexts/iam/user/domain/user.ts`
- **Current mitigation:** None - role is hard-coded.
- **Recommendations:** (1) Implement role field in User aggregate, (2) Add Role value object with domain-driven constraints, (3) Implement role-based authorization middleware, (4) Add tests verifying different users have correct roles, (5) Audit all authorization checks to ensure they use actual roles, not hard-coded ones.

### Validation Service Does Not Enforce Referential Integrity
- **Risk:** Foreign key constraints exist only in database. Application-level validation is a stub. Orphaned records possible if validations are bypassed.
- **Files:** `src/contexts/procurement/purchase-order/infrastructure/query-services/typeorm-purchase-order-validation.service.ts`
- **Current mitigation:** Database constraints only (fragile if accessed outside this application).
- **Recommendations:** (1) Implement validation methods (supplier, units), (2) Add repository methods to check existence, (3) Create custom domain exceptions for missing references, (4) Document that validations are required before saving aggregates.

### No Rate Limiting or Request Throttling
- **Risk:** No observable rate limiting on API endpoints. Potential for brute force attacks, DOS.
- **Files:** Global (not implemented anywhere)
- **Current mitigation:** None.
- **Recommendations:** (1) Implement NestJS throttler guard, (2) Add rate limiting middleware, (3) Configure per-endpoint limits, (4) Log excessive requests for security monitoring.

### Console.log Statements in Production Code
- **Risk:** Sensitive data might be logged. Debug logging exposed in production.
- **Files:** 10+ files including event store, subscribers, use cases
- **Current mitigation:** None.
- **Recommendations:** (1) Replace console.log with structured logger (Winston, Pino), (2) Set appropriate log levels (debug, info, warn, error), (3) Sanitize logged data, (4) Disable debug logs in production via configuration.

## Performance Bottlenecks

### Unit Conversion Service N+1 Query Pattern
- **Problem:** `ConvertQuantity.run()` fetches ALL conversion rules from database every time a conversion is requested.
- **Files:** `src/contexts/shared-kernel/unit-conversion/application/convert-quantity/convert-quantity.ts` (line 24)
- **Cause:** Loads all rules then searches in memory instead of querying for the specific rule needed.
- **Improvement path:** (1) Add `findByUnitIds(fromUnitId, toUnitId)` method to repository, (2) Query only the specific conversion rule, (3) Cache conversion rules if they're static, (4) Add pagination if rule set grows large.

### PurchaseOrderQueryService Query Complexity
- **Problem:** Search method creates complex QueryBuilder with filters, ordering, and pagination without index hints.
- **Files:** `src/contexts/procurement/purchase-order/infrastructure/query-services/typeorm-purchase-order-query.service.ts` (lines 42-120)
- **Cause:** LEFT JOIN with supplier, dynamic filtering on multiple fields, no query optimization.
- **Improvement path:** (1) Add database indexes for frequently filtered fields (status, requestedBy, requestedDate), (2) Consider denormalized read models if filtering is complex, (3) Add query result caching for stable datasets, (4) Benchmark filter performance with large datasets.

### Event Store Insert for Every Domain Event
- **Problem:** Every domain event triggers a database insert into event_store table.
- **Files:** `src/shared/infrastructure/event-sourcing/subscribers/persist-domain-events.subscriber.ts`
- **Cause:** Universal event listener on all domain events (`@OnEvent('**')`).
- **Improvement path:** (1) Batch event inserts if possible, (2) Use async persistence with queue, (3) Consider eventual consistency - only persist critical events synchronously, (4) Add metrics to monitor event store write latency.

### Seeders Load Massive Data Inline
- **Problem:** Ingredient seeder (458 lines), Purchase Order seeder (399 lines), Product seeder (193 lines) contain hardcoded seed data.
- **Files:** `src/shared/infrastructure/database/seeders/{ingredient,purchase-order,product}.seeder.ts`
- **Cause:** No external data source; all data in-memory.
- **Improvement path:** (1) Move seed data to JSON/CSV files, (2) Stream data instead of loading all into memory, (3) Use batch inserts via QueryBuilder, (4) Consider removing large seeders from production builds.

## Fragile Areas

### PurchaseOrder Status Transition Logic
- **Files:** `src/contexts/procurement/purchase-order/domain/purchase-order.ts` (lines 97-785)
- **Why fragile:** Complex state machine with multiple valid transitions, many preconditions, and side effects (events). Hard to track all valid paths through state transitions. Easy to miss edge cases when adding new transitions.
- **Safe modification:** (1) Add comprehensive state transition tests covering all paths, (2) Document all valid transitions with examples, (3) Consider extracting to explicit state machine (State pattern), (4) Add state transition audit logging.
- **Test coverage:** Limited - status transition paths not all covered. Missing tests for concurrent status change attempts.

### InventoryLevel Quantity Checks
- **Files:** `src/contexts/inventory/stock-level/domain/inventory-level.ts` (lines 71-86, 110-147)
- **Why fragile:** Complex rules around minimum/maximum quantities with optional values. Event emission based on thresholds is incomplete. Overstock detection not implemented.
- **Safe modification:** (1) Add invariant tests ensuring quantity consistency, (2) Test all threshold combinations (min < current < max, current = min, current = 0, etc.), (3) Verify events are emitted only once per threshold crossing, (4) Add field validation in constructor.
- **Test coverage:** Missing tests for threshold crossing scenarios. Overstock event never tested because it's not implemented.

### Purchase Order Item Cancellation
- **Files:** `src/contexts/procurement/purchase-order/domain/purchase-order-item.ts` (complex cancellation logic)
- **Why fragile:** Items can be partially cancelled. Cancelled items must not be included in totals. Interaction between cancellation state and reception tracking unclear.
- **Safe modification:** (1) Add tests for partial cancellation scenarios, (2) Verify total calculations exclude cancelled items, (3) Test cancellation after partial reception, (4) Ensure event ordering doesn't cause issues.
- **Test coverage:** New migration `1769310267750-AddCancellationFieldsToPurchaseOrderItems` suggests recent changes. Tests likely incomplete for new cancellation fields.

### Event Sourcing Metadata Handling
- **Files:** `src/shared/infrastructure/event-sourcing/persistence/event-store.entity.ts`, `src/shared/infrastructure/event-sourcing/subscribers/persist-domain-events.subscriber.ts`
- **Why fragile:** Event metadata is optional. `correlationId` duplicated from metadata for indexing. Event reconstruction may fail if metadata is missing.
- **Safe modification:** (1) Make metadata required or provide defaults, (2) Add schema validation for metadata, (3) Test event replay with missing metadata, (4) Ensure indices cover all query patterns.
- **Test coverage:** No tests verifying event replay works correctly. Metadata handling not tested.

## Scaling Limits

### Event Store Single Table Design
- **Current capacity:** Single `event_store` table with compound indices.
- **Limit:** As event volume grows (millions of records), queries will slow without proper partitioning. Table may become unwieldy for maintenance.
- **Scaling path:** (1) Implement event store partitioning by aggregate type or date range, (2) Archive old events to separate tables, (3) Use event stream snapshots for large aggregates, (4) Consider time-series database for event metrics.

### In-Memory Event Bus
- **Current capacity:** Events published to in-memory subscribers only. Works for single-process deployments.
- **Limit:** No cross-process event communication. Scaling horizontally (multiple instances) means events aren't shared between processes.
- **Scaling path:** (1) Replace InMemoryNestEventBus with message queue (RabbitMQ, Kafka), (2) Implement event persistence before delivery, (3) Add consumer groups for subscriber scalability, (4) Handle eventual delivery failures with dead-letter queues.

### TypeORM Repository Queries Without Batch Optimization
- **Current capacity:** Repository queries assume small-to-medium datasets.
- **Limit:** Bulk operations (delete, update) may be inefficient. No batch insert support in repositories.
- **Scaling path:** (1) Add bulk operation methods to repositories, (2) Use QueryBuilder for batch operations, (3) Implement pagination for large result sets, (4) Add query timeout limits to prevent runaway queries.

## Dependencies at Risk

### TypeORM 0.3 Still Under Development
- **Risk:** Version 0.3 was release candidate for 1.0. Many features still in flux. May have breaking changes.
- **Impact:** Upgrading to 1.0 or dropping support could break migrations and decorators.
- **Migration plan:** (1) Check release notes for 0.3 end-of-life date, (2) Plan upgrade to 1.0 LTS, (3) Test migrations thoroughly, (4) Document any deprecated patterns used.

## Missing Critical Features

### No Actual Role-Based Authorization
- **Problem:** Role system is stubbed (hard-coded ADMIN). No authorization guards check user roles.
- **Blocks:** Cannot implement role-based access control. All users treated as admins.

### No Purchase Method Implementation
- **Problem:** `purchaseMethod` field exists but logic to register/update it is missing or disabled.
- **Blocks:** Cannot track different procurement methods (email, phone, EDI, etc.).

### No Email Notifications
- **Problem:** Events like "SupplierCreated", "UnitCreated" have stub subscribers that log but don't send emails.
- **Blocks:** No notifications to stakeholders about system state changes.

### No Audit Trail (Beyond Event Store)
- **Problem:** Event store captures domain events but not user actions, authorization decisions, or system operations.
- **Blocks:** Cannot produce audit reports for compliance.

## Test Coverage Gaps

### PurchaseOrder Status Transitions
- **What's not tested:** Not all valid and invalid state transitions. Concurrent modification attempts. Event ordering when multiple status changes happen.
- **Files:** `src/contexts/procurement/purchase-order/domain/purchase-order.ts`
- **Risk:** Regressions when adding new transitions or modifying preconditions.
- **Priority:** High

### Unit Conversion Rules
- **What's not tested:** Missing conversion rule scenarios. Circular conversion rules. Unit compatibility validation.
- **Files:** `src/contexts/shared-kernel/unit-conversion/application/convert-quantity/convert-quantity.ts`
- **Risk:** Failing conversions at runtime without clear error messages.
- **Priority:** High

### Supplier Validation in Purchase Order Creation
- **What's not tested:** Creating purchase orders with non-existent suppliers. Creating with non-existent units.
- **Files:** `src/contexts/procurement/purchase-order/application/create/create-purchase-order.ts`
- **Risk:** Data integrity issues, orphaned references.
- **Priority:** Critical

### Event Sourcing Event Replay
- **What's not tested:** Replaying events to rebuild aggregate state. Event metadata handling. Event versioning/upcasting.
- **Files:** `src/shared/infrastructure/event-sourcing/`
- **Risk:** Event replay fails in production, losing ability to recover aggregate state.
- **Priority:** High

### Inventory Level Threshold Crossing
- **What's not tested:** Crossing low-stock threshold. Crossing out-of-stock threshold (0). Interactions with maximum threshold.
- **Files:** `src/contexts/inventory/stock-level/domain/inventory-level.ts`
- **Risk:** Alerts not triggered when expected, or triggered multiple times.
- **Priority:** Medium

### InventoryBatch FIFO Logic
- **What's not tested:** Complex FIFO ordering with multiple batches. Partial consumption across batches. Edge cases with equal dates.
- **Files:** `src/contexts/inventory/batch/domain/services/fifo-inventory.service.ts`
- **Risk:** Incorrect ingredient aging, potential waste of expired ingredients.
- **Priority:** High

---

*Concerns audit: 2026-03-17*

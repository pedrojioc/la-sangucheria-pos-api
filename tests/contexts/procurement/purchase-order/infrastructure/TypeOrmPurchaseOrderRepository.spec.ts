/**
 * TypeOrmPurchaseOrderRepository infrastructure test
 *
 * NOTE: This test requires a running PostgreSQL instance because:
 * - PurchaseOrderItemEntity → UnitEntity which uses PostgreSQL enum types
 * - better-sqlite3 does not support enum columns
 *
 * Run with a real DB: pnpm test:e2e
 * This file is intentionally skipped in the unit project.
 */
describe.skip('TypeOrmPurchaseOrderRepository', () => {
  it('requires PostgreSQL — see tests/e2e/ for full infrastructure tests', () => {})
})

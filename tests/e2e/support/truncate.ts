import { DataSource } from 'typeorm'

const EXCLUDED_TABLES = ['migrations']

/**
 * Composable, table-list-driven truncation (design D6), replacing the
 * order-specific `cleanOrderTables()` compatibility shim in
 * `e2e-data-source.ts` (spec requirement "Composable truncation between
 * tests"). Removed once its remaining callers — `order-repository` and
 * `kitchen-board-query` — switch over in PR3 (tasks 3.2/3.3).
 */
export async function truncateTables(ds: DataSource, tables: string[]): Promise<void> {
  if (tables.length === 0) {
    return
  }

  const quoted = tables.map(table => `"${table}"`).join(', ')
  await ds.query(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE`)
}

/**
 * Wipes every table in the current schema except `migrations`, discovered
 * dynamically via `information_schema` rather than a hand-maintained list —
 * the schema has 78 FKs (InitialSchema migration), so ordering a manual
 * DELETE/TRUNCATE list by hand is a maintenance trap. One
 * `TRUNCATE ... CASCADE` statement is order-free and safe because the
 * container database is disposable (design D6).
 */
export async function resetDatabase(ds: DataSource): Promise<void> {
  const schema = process.env.DB_SCHEMA || 'public'

  const rows: Array<{ table_name: string }> = await ds.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = $1 AND table_type = 'BASE TABLE'`,
    [schema]
  )

  const tables = rows.map(row => row.table_name).filter(name => !EXCLUDED_TABLES.includes(name))

  await truncateTables(ds, tables)
}

/**
 * Table lists for specs that truncate a narrower scope directly instead of
 * calling `resetDatabase()`. Listed child-before-parent for readability only
 * — `TRUNCATE ... CASCADE` does not require FK-dependency ordering. Wired
 * into `order-repository.e2e-spec.ts` / `kitchen-board-query.e2e-spec.ts` and
 * `purchase-reception-atomicity.e2e-spec.ts` respectively in PR3 (tasks 3.1-3.3).
 */
export const ORDER_TABLES = ['order_items', 'orders']

export const PURCHASE_RECEPTION_TABLES = [
  'inventory_levels',
  'inventory_movements',
  'inventory_batches',
  'purchase_order_items',
  'purchase_orders'
]

import { DataSource } from 'typeorm'

const EXCLUDED_TABLES = ['migrations']

/**
 * Composable, table-list-driven truncation (design D6), which replaced the
 * order-specific `cleanOrderTables()` compatibility shim previously in
 * `e2e-data-source.ts` (spec requirement "Composable truncation between
 * tests"). `order-repository.e2e-spec.ts` and `kitchen-board-query.e2e-spec.ts`
 * now use this via `ORDER_TABLES`, and the shim has been deleted.
 */
export async function truncateTables(ds: DataSource, tables: string[]): Promise<void> {
  if (tables.length === 0) {
    return
  }

  // Postgres identifier escaping: double any embedded `"` before wrapping in
  // quotes. Defensive hardening only — today's callers pass hardcoded
  // literals or information_schema-derived names, but this is an exported
  // function taking a bare `string[]` with no validation, and PR3 adds more
  // callers.
  const quoted = tables.map(table => `"${table.replace(/"/g, '""')}"`).join(', ')
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
 * `purchase-reception-atomicity.e2e-spec.ts` respectively.
 */
export const ORDER_TABLES = ['order_items', 'orders']

// TODO(e2e-debt): PURCHASE_RECEPTION_TABLES (and ORDER_TABLES above) are
// hand-maintained literal arrays, duplicating what resetDatabase() already
// derives dynamically via information_schema specifically to avoid this
// maintenance trap — either derive this list the same way or drop it in
// favor of always calling resetDatabase().
export const PURCHASE_RECEPTION_TABLES = [
  'inventory_levels',
  'inventory_movements',
  'inventory_batches',
  'purchase_order_items',
  'purchase_orders'
]

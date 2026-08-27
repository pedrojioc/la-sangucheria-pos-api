import { config } from 'dotenv'
import { DataSource } from 'typeorm'

// Reuses the exact same env-var-driven connection convention as `ormconfig.ts`
// (the DataSource used by `pnpm start:dev` / `pnpm migration:run`). No
// testcontainers/docker-compose — these tests target the local Postgres
// instance the project already runs against in development.
config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
})

export function createE2eDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'la_sangucheria_pos',
    schema: process.env.DB_SCHEMA || 'public',
    entities: [__dirname + '/../../../src/**/*.entity{.ts,.js}'],
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false
  })
}

/**
 * Deletes all rows created by these e2e tests. Migrations are assumed to
 * already be applied (via `pnpm migration:run`) against the target database
 * — these tests do not run migrations themselves, matching the project's
 * "connect to an already-running local Postgres" convention.
 *
 * Only truncates the two tables this suite writes to; does not touch other
 * domain data seeded in the shared dev database.
 */
export async function cleanOrderTables(dataSource: DataSource): Promise<void> {
  await dataSource.query('DELETE FROM order_items')
  await dataSource.query('DELETE FROM orders')
}

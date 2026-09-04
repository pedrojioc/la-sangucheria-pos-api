import { DataSource } from 'typeorm'

// Both DataSources below read exclusively from `process.env`, which
// `global-setup.ts` forces to point at the ephemeral Testcontainers Postgres
// before any spec file loads. There is no `E2E_DB_URL` (or equivalent)
// escape hatch — the container is the only supported connection path. This
// removes the machine-state coupling the e2e suite used to have on the
// developer's own local Postgres instance.

const ENTITIES_GLOB = __dirname + '/../../../src/**/*.entity{.ts,.js}'
const MIGRATIONS_GLOB =
  __dirname + '/../../../src/shared/infrastructure/database/typeorm/migrations/*{.ts,.js}'

const REQUIRED_CONTAINER_ENV_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE'
] as const

function requireContainerEnv(): void {
  const missing = REQUIRED_CONTAINER_ENV_VARS.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not set. e2e tests must run ` +
        'via `pnpm test:e2e`, which starts the Postgres testcontainer and forces DB_* env vars ' +
        'in Jest globalSetup (tests/e2e/support/global-setup.ts). Running this file directly, ' +
        'or outside the `e2e` Jest project, is not supported — there is no local-Postgres fallback.'
    )
  }
}

function connectionOptions() {
  requireContainerEnv()

  return {
    type: 'postgres' as const,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    schema: process.env.DB_SCHEMA || 'public',
    logging: process.env.DB_LOGGING === 'true',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    synchronize: false
  }
}

/** DataSource used by specs to read/write through TypeORM repositories directly. */
export function createE2eDataSource(): DataSource {
  return new DataSource({
    ...connectionOptions(),
    entities: [ENTITIES_GLOB]
  })
}

/** DataSource used once by `global-setup.ts` to run migrations against the fresh container. */
export function createMigrationDataSource(): DataSource {
  return new DataSource({
    ...connectionOptions(),
    migrations: [MIGRATIONS_GLOB],
    migrationsTableName: 'migrations'
  })
}

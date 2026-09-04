import { generateKeyPairSync } from 'crypto'
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { createMigrationDataSource } from './e2e-data-source'

declare global {
  // eslint-disable-next-line no-var -- Jest globalSetup/globalTeardown contract: state must
  // survive as a plain global between the two hook modules, which are loaded independently.
  var __PG_CONTAINER__: StartedPostgreSqlContainer | undefined
}

const POSTGRES_IMAGE = 'postgres:16-alpine'

function forceEnv(key: string, value: string): void {
  process.env[key] = value
}

function defaultEnv(key: string, value: string): void {
  process.env[key] = process.env[key] ?? value
}

function generateEphemeralRsaKeyPair(): { publicKey: string; privateKey: string } {
  return generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  })
}

/**
 * Jest `globalSetup` contract. Runs once, in the main Jest process, before
 * any e2e spec file loads. Starts an ephemeral Postgres container, forces
 * the entire app's env-var-driven config chain (DatabaseModule, ormconfig,
 * RS256 JWT wiring, env.validation.ts) to point at it, and applies all
 * TypeORM migrations. No `E2E_DB_URL` escape hatch — the container is the
 * only supported connection path (see proposal + design D1/D3).
 *
 * `--runInBand` (package.json) guarantees these `process.env` writes are
 * visible to every spec file: they all run in this same process, no worker
 * fork happens after this point.
 */
export default async function globalSetup(): Promise<void> {
  let container: StartedPostgreSqlContainer
  try {
    container = await new PostgreSqlContainer(POSTGRES_IMAGE).start()
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(
      'Docker daemon unreachable — e2e requires Docker. There is no local-Postgres fallback ' +
        `by design (see tests/e2e/support/e2e-data-source.ts). Original error: ${reason}`
    )
  }

  global.__PG_CONTAINER__ = container

  // Database — forced, never defaulted: the container is the only source of truth.
  forceEnv('DB_TYPE', 'postgres')
  forceEnv('DB_HOST', container.getHost())
  forceEnv('DB_PORT', String(container.getPort()))
  forceEnv('DB_USERNAME', container.getUsername())
  forceEnv('DB_PASSWORD', container.getPassword())
  forceEnv('DB_DATABASE', container.getDatabase())
  forceEnv('DB_SCHEMA', 'public')
  forceEnv('DB_SYNCHRONIZE', 'false')
  forceEnv('DB_LOGGING', 'false')
  forceEnv('DB_SSL', 'false')

  // Everything else in env.validation.ts — defaulted so a contributor never needs a
  // gitignored .env.test file (that's the same machine-state coupling this change removes).
  // KEEP IN SYNC with the required (non-@IsOptional) fields of `EnvironmentVariables` in
  // src/config/env/env.validation.ts — that file is the source of truth; a new required
  // field added there must be defaulted here too, or AppModule boot will fail with an
  // opaque validation error instead of a clear "missing env var" message.
  defaultEnv('NODE_ENV', 'test')
  defaultEnv('PORT', '3000')
  defaultEnv('APP_NAME', 'La Sanguchería POS (e2e)')
  defaultEnv('API_PREFIX', 'api')
  defaultEnv('API_VERSION', 'v1')
  defaultEnv('CORS_ENABLED', 'false')
  defaultEnv('CORS_ORIGIN', 'http://localhost:3001')
  defaultEnv('LOG_LEVEL', 'error')
  defaultEnv('JWT_SECRET', 'e2e-test-secret')
  defaultEnv('JWT_EXPIRATION', '7d')

  // RS256 JWT wiring (JwtStrategy, Rs256JwtService) — read directly via ConfigService.get,
  // not declared in env.validation.ts, but non-null-asserted at construction time. An
  // ephemeral keypair minted per run is sufficient; no user/DB round trip is required to
  // exercise JwtAuthGuard (design D4).
  //
  // The pair must be generated and set atomically: if only ONE of JWT_PUBLIC_KEY /
  // JWT_PRIVATE_KEY is already present in the environment (e.g. a stale value from a
  // contributor's shell profile), defaulting them independently would pair a pre-existing
  // key with a freshly generated, unrelated one — Rs256JwtService signs with one key while
  // JwtStrategy/JwtRefreshStrategy verify with the other, and every authenticated e2e
  // request fails with an opaque "invalid signature". Generation is also skipped entirely
  // (not just deferred) when both are already set, avoiding a wasted synchronous 2048-bit
  // RSA keygen (~50-150ms) on every run.
  if (!process.env.JWT_PUBLIC_KEY || !process.env.JWT_PRIVATE_KEY) {
    const { publicKey, privateKey } = generateEphemeralRsaKeyPair()
    forceEnv('JWT_PUBLIC_KEY', publicKey)
    forceEnv('JWT_PRIVATE_KEY', privateKey)
  }
  defaultEnv('JWT_ISSUER', 'la-sangucheria-pos-e2e')
  defaultEnv('JWT_AUDIENCE', 'la-sangucheria-pos-e2e-clients')
  defaultEnv('JWT_ACCESS_EXPIRATION', '15m')
  defaultEnv('JWT_REFRESH_EXPIRATION', '7d')

  // CloudflareImagesStorage (SharedInfrastructureModule, always in AppModule's graph) reads
  // these eagerly via `configService.getOrThrow` at construction time — it crashes AppModule
  // boot if unset, regardless of whether a spec ever touches file storage. Dummy values are
  // sufficient: no spec in this PR exercises an upload/delete call against the real API.
  defaultEnv('CLOUDFLARE_ACCOUNT_ID', 'e2e-dummy-account-id')
  defaultEnv('CLOUDFLARE_IMAGES_API_TOKEN', 'e2e-dummy-api-token')
  defaultEnv('CLOUDFLARE_IMAGES_ACCOUNT_HASH', 'e2e-dummy-account-hash')

  // From here on the container is already started and stashed on
  // `global.__PG_CONTAINER__`. Jest's `@jest/core` invokes `globalSetup` and
  // `globalTeardown` as two independent sequential calls with no surrounding
  // try/finally of its own — if this function rejects, `globalTeardown` never
  // runs, and the container leaks (Ryuk, Testcontainers' reaper sidecar, is
  // often disabled in CI / Docker-in-Docker setups). Explicitly stop the
  // container on any failure here before re-throwing, so a failed
  // globalSetup never leaves an orphaned container behind.
  try {
    const migrationDataSource = createMigrationDataSource()
    await migrationDataSource.initialize()
    // The developer's local Postgres (Postgres.app / homebrew) already has this
    // extension enabled from some out-of-band setup step; a fresh Testcontainers
    // image does not. InitialSchemaMigration relies on `uuid_generate_v4()` for
    // `event_store.id`'s default value, so it must exist before migrations run.
    // Not a migration-file change (keeps the zero-`src/`-diff boundary) — this
    // is bootstrap the harness itself owns, same as running migrations.
    await migrationDataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    await migrationDataSource.runMigrations()
    await migrationDataSource.destroy()
  } catch (error) {
    await container.stop()
    global.__PG_CONTAINER__ = undefined
    throw error
  }
}

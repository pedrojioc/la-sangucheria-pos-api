import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql'

declare global {
  // eslint-disable-next-line no-var -- see global-setup.ts
  var __PG_CONTAINER__: StartedPostgreSqlContainer | undefined
}

/**
 * Jest `globalTeardown` contract. Runs once after all e2e specs complete
 * (pass or fail) and stops the container started in `global-setup.ts`, so no
 * container or dev-DB write survives the run.
 */
export default async function globalTeardown(): Promise<void> {
  if (global.__PG_CONTAINER__) {
    await global.__PG_CONTAINER__.stop()
    global.__PG_CONTAINER__ = undefined
  }
}

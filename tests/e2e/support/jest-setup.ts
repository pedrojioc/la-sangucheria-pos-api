// `testTimeout` is a global-only Jest config key (see jest-config's
// groupOptions) — it cannot be set per-project in `jest.config.js`'s
// `projects` array without triggering a "Unknown option" warning. This
// `setupFilesAfterEnv` script scopes a longer default timeout to the `e2e`
// project only (AppModule boot + container round trips are slower than the
// unit suite's 5s default), leaving the `unit` project's timeout untouched.
jest.setTimeout(60000)

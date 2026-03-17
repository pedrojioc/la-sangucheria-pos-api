# Technology Stack

**Analysis Date:** 2026-03-17

## Languages

**Primary:**
- TypeScript 5.7.3 - Application code, type-safe development

**Supporting:**
- JavaScript (Node.js runtime)

## Runtime

**Environment:**
- Node.js 22.18.6+ (specified in package.json `@types/node`)

**Package Manager:**
- pnpm (preferred, uses `pnpm-lock.yaml`)
- Lockfile: Present (`pnpm-lock.yaml`)

## Frameworks

**Core:**
- NestJS 11.0.1 - Backend framework, REST API
- Express (via `@nestjs/platform-express` 11.0.1) - HTTP server underlying NestJS

**CQRS & Events:**
- NestJS CQRS 11.0.3 - Command/Query pattern for use cases
- NestJS Event Emitter 3.0.1 - In-memory event bus for domain events
- RxJS 7.8.1 - Reactive streams (NestJS dependency)

**Database:**
- TypeORM 0.3.26 - ORM for PostgreSQL
- NestJS TypeORM 11.0.0 - NestJS integration for TypeORM

**Authentication & Authorization:**
- Passport.js 0.7.0 - Auth middleware framework
- NestJS Passport 11.0.5 - Passport integration
- Passport JWT 4.0.1 - JWT strategy
- JWT (jsonwebtoken) 9.0.3 - Token generation/verification
- NestJS JWT 11.0.2 - JWT module
- argon2 0.44.0 - Password hashing (RS256 asymmetric encryption)

**Configuration:**
- NestJS Config 4.0.2 - Environment and config management
- dotenv 17.2.1 - Load `.env` files

**Validation:**
- class-validator 0.14.2 - Declarative validation via decorators
- class-transformer 0.5.1 - DTO transformation

**HTTP & Utilities:**
- cookie-parser 1.4.7 - Parse HTTP cookies (for JWT refresh tokens)
- uuid 13.0.0 - UUID generation for domain identifiers
- uuid-validate 0.0.3 - UUID validation
- reflect-metadata 0.2.2 - Metadata reflection (NestJS dependency)

**Database Driver:**
- pg 8.16.3 - PostgreSQL client

## Build & Development Tools

**Compilation:**
- ts-loader 9.5.2 - TypeScript loader for webpack
- swc/core 1.10.7 - Fast TypeScript compiler (alternative to Babel)
- swc/cli 0.6.0 - CLI for SWC

**NestJS CLI:**
- @nestjs/cli 11.0.0 - NestJS project scaffolding and build
- @nestjs/schematics 11.0.0 - Code generation templates

**Code Quality:**
- ESLint 9.18.0 - Linting
- @typescript-eslint/eslint-plugin 8.41.0 - TypeScript rules
- @typescript-eslint/parser 8.41.0 - TypeScript parser
- Prettier 3.4.2 - Code formatting
- eslint-plugin-import 2.32.0 - Import statement linting
- eslint-plugin-prettier 5.2.2 - Prettier integration
- eslint-config-prettier 10.0.1 - Disable conflicting ESLint rules

**Testing:**
- Jest 29.7.0 - Test runner and framework
- ts-jest 29.2.5 - Jest transformer for TypeScript
- @nestjs/testing 11.0.1 - NestJS testing utilities
- supertest 7.0.0 - HTTP assertion library (for E2E tests)
- @faker-js/faker 10.0.0 - Fake data generation for tests

**TypeScript Configuration:**
- tsconfig-paths 4.2.0 - Path alias resolver (for `@/*` imports)
- ts-node 10.9.2 - Execute TypeScript directly (for migrations, seeders)
- source-map-support 0.5.21 - Source map support in stack traces

**TypeORM CLI:**
- typeorm 0.3.26 CLI via ts-node for migrations

## Configuration Files

**Environment:**
- `.env.{NODE_ENV}` loading (e.g., `.env.development`, `.env.production`)
- `.env` fallback
- Config validation via schema (location: `src/config/env/env.validation.ts`)

**Build:**
- `nest-cli.json` - NestJS build configuration
- `tsconfig.json` - TypeScript compiler options
- `tsconfig.build.json` - Build-specific TypeScript config
- `jest.config.js` - Jest test runner configuration

**Code Quality:**
- `.prettierrc` - Prettier formatting rules
- `eslint.config.mjs` - ESLint configuration (flat config format)

**Database:**
- `ormconfig.ts` - TypeORM data source (for migrations)
- Connection pooling: 20 max connections, 10s connection timeout, 30s idle timeout

## Path Aliases

All imports use path aliases for clean navigation:
- `@/*` → `src/*`
- `@shared/*` → `src/shared/*`
- `@contexts/*` → `src/contexts/*`
- `@shared-kernel/*` → `src/contexts/shared-kernel/*`
- `@core/*` → `src/core/*`
- `@test/*` → `tests/*`

## Key Dependencies Summary

| Category | Package | Version | Purpose |
|----------|---------|---------|---------|
| Framework | NestJS | 11.0.1 | REST API framework |
| ORM | TypeORM | 0.3.26 | PostgreSQL ORM |
| Database | pg | 8.16.3 | PostgreSQL driver |
| Auth | Passport + JWT | 0.7.0 + 9.0.3 | Authentication strategy |
| Password Hash | argon2 | 0.44.0 | Secure password hashing |
| Events | @nestjs/event-emitter | 3.0.1 | Domain event publishing |
| Validation | class-validator | 0.14.2 | DTO validation |
| Testing | Jest | 29.7.0 | Test framework |
| Linting | ESLint | 9.18.0 | Code quality |
| Formatting | Prettier | 3.4.2 | Code formatting |

## Platform Requirements

**Development:**
- Node.js 22.18.6+
- pnpm 8.0+
- PostgreSQL 12+

**Production:**
- Node.js 22.18.6+
- PostgreSQL 12+

---

*Stack analysis: 2026-03-17*

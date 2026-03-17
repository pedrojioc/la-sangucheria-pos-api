# External Integrations

**Analysis Date:** 2026-03-17

## APIs & External Services

**Cloudflare Images (Production):**
- Service: Cloudflare Images API for image storage and CDN delivery
- What it's used for: Optimized image hosting with variants (public, thumbnail), automatic format optimization
- SDK/Client: Native fetch API with `FormData` (no SDK package)
- Configuration: `src/shared/infrastructure/storage/cloudflare-images/cloudflare-images-storage.service.ts`
- Auth: Bearer token via `CLOUDFLARE_IMAGES_API_TOKEN` env var

**API Documentation:**
- Reference: https://developers.cloudflare.com/images/

## Data Storage

**Primary Database:**
- Type: PostgreSQL 12+
- Connection: Configured via `ormconfig.ts` and `src/config/database/typeorm.config.ts`
- Host: `DB_HOST` (default: localhost)
- Port: `DB_PORT` (default: 5432)
- Database: `DB_DATABASE` (default: `la_sangucheria_pos`)
- Schema: `DB_SCHEMA` (default: `public`)
- Client: TypeORM 0.3.26
- Pool Settings:
  - Max connections: 20
  - Connection timeout: 10 seconds
  - Idle timeout: 30 seconds
- SSL: Configurable via `DB_SSL` env var (defaults to false)
- Logging: Configurable via `DB_LOGGING` env var
- Migrations: Auto-run on startup controlled by `TYPEORM_MIGRATIONS_RUN` env var
- Location: `src/shared/infrastructure/database/typeorm/migrations/`

**File Storage (Development):**
- Type: Local filesystem
- Implementation: `src/shared/infrastructure/storage/local/local-file-storage.service.ts`
- Storage directory: `LOCAL_UPLOADS_DIR` env var (default: `uploads/`)
- Public base URL: `LOCAL_UPLOADS_URL` env var (default: `http://localhost:3000`)
- File structure: `uploads/{folder}/{timestamp}-{random}.ext`
  - Images stored in: `uploads/images/`
  - Documents stored in: `uploads/files/`

**Caching:**
- Type: In-memory (no external caching service)
- Implementation: NestJS Event Emitter for synchronous domain event dispatch

## Authentication & Identity

**Auth Provider:**
- Type: Custom JWT-based authentication
- Strategy: RS256 (RSA asymmetric signing)
- Location: `src/contexts/iam/authentication/`

**JWT Configuration:**
- Secret: `JWT_SECRET` (for fallback, primarily RS256)
- Private Key: `JWT_PRIVATE_KEY` env var (RSA private key in PEM format)
- Public Key: `JWT_PUBLIC_KEY` env var (RSA public key in PEM format)
- Issuer: `JWT_ISSUER` (default: `lasangucheria-pos`)
- Audience: `JWT_AUDIENCE` (default: `lasangucheria-pos-api`)
- Access token expiration: `JWT_ACCESS_EXPIRATION` (default: 15m)
- Refresh token expiration: `JWT_REFRESH_EXPIRATION` (default: 7d)

**Password Security:**
- Algorithm: Argon2 (via `argon2` v0.44.0 package)
- Implementation: `src/contexts/iam/user/infrastructure/services/argon2-password-hasher.service.ts`
- Domain interface: `src/contexts/iam/user/domain/services/password-hasher.ts`

**Token Storage (Client-side):**
- Refresh tokens: Stored in httpOnly cookies
- Access token: Typically in Authorization header (Bearer token)
- Cookie settings: `httpOnly: true`, `secure` (for HTTPS)
- Location: `src/contexts/iam/authentication/presentation/http/controllers/auth.controller.ts`

**Routes:**
- Login: `POST /api/v1/auth/login` → `src/contexts/iam/authentication/presentation/http/controllers/auth.controller.ts`
- Refresh Token: `POST /api/v1/auth/refresh` → uses JWT refresh strategy
- Logout: `POST /api/v1/auth/logout` → invalidates refresh token

## Authorization

**Type:** Role-based access control (RBAC)
- JWT claims include user roles
- Global JWT guard applied to all routes: `src/contexts/iam/authentication/infrastructure/guards/jwt-auth.guard.ts`
- Implementation: `@nestjs/passport` with JWT strategy
- Strategy file: `src/contexts/iam/authentication/infrastructure/strategies/jwt.strategy.ts`

## Monitoring & Observability

**Error Tracking:**
- Type: None detected (no Sentry, Rollbar, or similar)
- Exception handling: Global filter `src/core/filters/global-exception.filter.ts`
  - Catches domain exceptions and formats them consistently

**Logs:**
- Type: Console-based logging
- Framework: NestJS Logger (built-in)
- Log level: `LOG_LEVEL` env var (default: `debug`)
- Modules log to: Standard Node.js console (stdout/stderr)
- No external log aggregation service detected

**Examples:**
- Cloudflare upload logging: `src/shared/infrastructure/storage/cloudflare-images/cloudflare-images-storage.service.ts` (lines 22-34, 86-87)
- Event bus logging: `src/shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts`

## CI/CD & Deployment

**Hosting:**
- Type: Not configured (no Docker, Vercel, Heroku, AWS integration detected)
- Application runs on configured `PORT` (default: 3000)

**CI Pipeline:**
- Type: None detected in codebase

**Build Output:**
- Built to: `dist/` directory
- Run command: `node dist/main` (production)

## CORS Configuration

**Development:**
- Enabled: `CORS_ENABLED` env var (default: true)
- Origin: `CORS_ORIGIN` env var (default: `http://localhost:3001`)
- Credentials: Enabled (for cookies)
- Implementation: `src/main.ts` lines 37-42

**Production:**
- CORS disabled by default (controlled by `NODE_ENV` check)

## Environment Configuration

**Required env vars:**
```
# Application
NODE_ENV                          # development, production, test
PORT                             # API server port (default: 3000)
APP_NAME                         # Application display name

# Database (PostgreSQL)
DB_HOST                          # PostgreSQL host
DB_PORT                          # PostgreSQL port (default: 5432)
DB_USERNAME                      # PostgreSQL user
DB_PASSWORD                      # PostgreSQL password
DB_DATABASE                      # Database name
DB_SCHEMA                        # Schema name (default: public)
DB_SYNCHRONIZE                   # Auto-sync TypeORM (false in production)
DB_LOGGING                       # SQL query logging (true/false)
DB_SSL                           # Use SSL for database (true/false)

# TypeORM
TYPEORM_MIGRATIONS_RUN          # Auto-run migrations on startup

# API
API_PREFIX                       # API route prefix (default: api)
API_VERSION                      # API version (default: v1)

# JWT Authentication (RS256 asymmetric)
JWT_SECRET                       # Fallback secret
JWT_PRIVATE_KEY                  # RSA private key (PEM format)
JWT_PUBLIC_KEY                   # RSA public key (PEM format)
JWT_ISSUER                       # Token issuer (default: lasangucheria-pos)
JWT_AUDIENCE                     # Token audience (default: lasangucheria-pos-api)
JWT_ACCESS_EXPIRATION           # Access token TTL (default: 15m)
JWT_REFRESH_EXPIRATION          # Refresh token TTL (default: 7d)

# CORS
CORS_ENABLED                     # Enable CORS (default: true in dev)
CORS_ORIGIN                      # Allowed origin (default: http://localhost:3001)

# Logging
LOG_LEVEL                        # Winston log level (default: debug)

# Cloudflare Images (Production)
CLOUDFLARE_ACCOUNT_ID          # Cloudflare account ID
CLOUDFLARE_IMAGES_API_TOKEN    # Cloudflare API token (Bearer auth)
CLOUDFLARE_IMAGES_ACCOUNT_HASH # Account hash for delivery URLs

# Local File Storage (Development)
LOCAL_UPLOADS_DIR              # Upload directory path (default: uploads/)
LOCAL_UPLOADS_URL              # Public URL for uploaded files
```

**Configuration Files Location:**
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables (NOT in git)
- `.env` - Fallback file
- Validation schema: `src/config/env/env.validation.ts`

## Webhooks & Callbacks

**Incoming Webhooks:**
- None detected

**Outgoing Webhooks:**
- None detected

**Event System (Internal):**
- Domain events are published to in-memory event bus
- Subscribers react to domain events (e.g., `IngredientCategoryCreated`, `ProductCreated`)
- Location: `src/shared/infrastructure/event-bus/in-memory/in-memory-nest-event-bus.ts`
- Event subscribers registered in: `src/shared/infrastructure/event-bus/providers/event-bus.tokens.ts`

## HTTP Client

**For external API calls:**
- Native Node.js `fetch` API is used (available in Node.js 22+)
- Example: Cloudflare Images upload/delete via `fetch()` in `cloudflare-images-storage.service.ts` lines 54, 97
- No axios or other HTTP client library in dependencies
- FormData API for multipart file uploads to Cloudflare

---

*Integration audit: 2026-03-17*

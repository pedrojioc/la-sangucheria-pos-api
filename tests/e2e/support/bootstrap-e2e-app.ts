import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DataSource } from 'typeorm'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import type { App } from 'supertest/types'

import { AppModule } from '@/app.module'
import { DomainExceptionFilter } from '@/core/filters/domain-exception.filter'
import { JwtAuthGuard } from '@/contexts/iam/authentication/infrastructure/guards/jwt-auth.guard'
import { JwtService } from '@/contexts/iam/authentication/domain/services/jwt.service'
import { signAccessToken } from './auth'

// TODO(e2e-debt): the `let app/dataSource/http/authHeader` + `beforeAll`
// destructuring boilerplate for consuming this context is duplicated
// verbatim across kitchen-board-query.e2e-spec.ts,
// purchase-reception-atomicity.e2e-spec.ts, and
// ingredient-category.e2e-spec.ts. A shared setup helper could reduce this
// repetition if a 4th+ spec adopts the same pattern.
export interface E2eContext {
  app: INestApplication<App>
  dataSource: DataSource
  http: () => ReturnType<typeof request>
  authHeader: () => Promise<[string, string]>
}

/**
 * Mirrors src/main.ts:16-41 global wiring (design D5) so the harness
 * exercises the same guard/pipe/filter/interceptor stack production traffic
 * does. Deliberately skips `app.useWebSocketAdapter(new IoAdapter(app))` and
 * `app.enableCors(...)` — no spec in this change exercises WebSocket
 * transport or cross-origin requests, and both only add boot cost here.
 *
 * KNOWN DRIFT RISK (accepted, proposal non-goal "configure-app.ts
 * extraction"): if src/main.ts's global wiring changes, this function must
 * be updated by hand — there is no shared source of truth, because sharing
 * one would require a `src/` change and this proposal mandates zero
 * production diff.
 */
export function configureE2eApp(app: INestApplication): void {
  // Express 5 defaults `query parser` to 'simple', which cannot parse the
  // bracket-notation filters (`?filters[field]=op:value`) CriteriaRequest
  // relies on (main.ts:18) — without this, filtered-search specs would see
  // buildFilters() silently return [] instead of applying the filter.
  ;(app as unknown as NestExpressApplication).set('query parser', 'extended')

  app.use(cookieParser())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  )

  app.useGlobalFilters(new DomainExceptionFilter())

  const reflector = app.get(Reflector)
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector))
  app.useGlobalGuards(new JwtAuthGuard(reflector))
}

/**
 * Builds a full `AppModule` through `Test.createTestingModule` + `app.init()`
 * and returns a ready-to-use HTTP-boundary context (design "Interfaces").
 * `dataSource` resolves to the container-backed `DataSource` DI already
 * builds against, per D1 — no `overrideProvider` is needed.
 */
export async function bootstrapE2eApp(): Promise<E2eContext> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule]
  }).compile()

  const app: INestApplication<App> = moduleFixture.createNestApplication()
  configureE2eApp(app)
  await app.init()

  const dataSource = app.get(DataSource)
  // Resolved under the `JwtService` provide token (AuthenticationModule
  // registers `{ provide: JwtService, useClass: Rs256JwtService }`) — the
  // instance IS Rs256JwtService, so calling generateAccessToken() here
  // exercises the real production signing logic, not a hand-rolled copy.
  const jwtService = app.get(JwtService)

  return {
    app,
    dataSource,
    http: () => request(app.getHttpServer()),
    // Mints a fresh token on every call (not once at bootstrap) so no
    // individual request's auth depends on how long prior tests in the same
    // file took to run relative to JWT_ACCESS_EXPIRATION.
    authHeader: async () => {
      const token = await signAccessToken(jwtService)
      return ['Authorization', `Bearer ${token}`]
    }
  }
}

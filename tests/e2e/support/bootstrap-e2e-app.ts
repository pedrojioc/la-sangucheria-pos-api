import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'
import { DataSource } from 'typeorm'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import type { App } from 'supertest/types'

import { AppModule } from '@/app.module'
import { DomainExceptionFilter } from '@/core/filters/domain-exception.filter'
import { JwtAuthGuard } from '@/contexts/iam/authentication/infrastructure/guards/jwt-auth.guard'
import { signAccessToken } from './auth'

export interface E2eContext {
  app: INestApplication<App>
  dataSource: DataSource
  http: () => ReturnType<typeof request>
  authHeader: () => [string, string]
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
  const token = signAccessToken()

  return {
    app,
    dataSource,
    http: () => request(app.getHttpServer()),
    authHeader: () => ['Authorization', `Bearer ${token}`]
  }
}

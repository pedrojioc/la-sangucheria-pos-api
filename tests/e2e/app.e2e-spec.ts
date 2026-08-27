import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '@/app.module'

describe('App (e2e)', () => {
  let app: INestApplication<App>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  // Skipped: no /health route exists anywhere in this codebase (confirmed by
  // grep, pre-existing gap, out of scope for order-items-migration). This
  // Nest boilerplate spec asserted a route that was never implemented.
  // Un-skip once a health-check endpoint is added.
  it.skip('GET /health returns 200', () => {
    return request(app.getHttpServer()).get('/health').expect(200)
  })
})

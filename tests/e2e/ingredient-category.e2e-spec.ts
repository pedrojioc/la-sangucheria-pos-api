import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { resetDatabase } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * HTTP-boundary exemplar (design "Exemplar Spec — ingredient-category.e2e-spec.ts",
 * spec requirement "New exemplar HTTP spec — ingredient-category"). Proves the
 * harness end to end: real HTTP request via supertest -> IngredientCategoryController
 * -> CommandBus/QueryBus -> real Postgres (Testcontainers), through the global
 * JwtAuthGuard and ValidationPipe wired by configureE2eApp().
 *
 * Also replaces app.e2e-spec.ts (deleted, task 2.6) as the harness's own smoke
 * test — this spec asserts real behavior instead of a single it.skip stub.
 */
describe('IngredientCategoryController (e2e)', () => {
  let app: INestApplication
  let dataSource: DataSource
  let http: E2eContext['http']
  let authHeader: E2eContext['authHeader']

  beforeAll(async () => {
    const context = await bootstrapE2eApp()
    app = context.app
    dataSource = context.dataSource
    http = context.http
    authHeader = context.authHeader
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await resetDatabase(dataSource)
  })

  describe('POST /ingredient-categories', () => {
    it('rejects an unauthenticated request with 401, proving JwtAuthGuard is wired', async () => {
      const response = await http()
        .post('/ingredient-categories')
        .send({ id: UuidMother.random(), name: 'Bebidas', isActive: true })

      expect(response.status).toBe(401)
    })

    it('creates the category and persists it with the client-supplied id', async () => {
      const id = UuidMother.random()

      const response = await http()
        .post('/ingredient-categories')
        .set(...authHeader())
        .send({ id, name: 'Bebidas', isActive: true })

      expect(response.status).toBe(201)

      const rows = await dataSource.query('SELECT * FROM ingredient_categories WHERE id = $1', [
        id
      ])

      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe('Bebidas')
      expect(rows[0].is_active).toBe(true)
    })

    it('rejects an invalid body with 400 and class-validator messages, proving ValidationPipe is wired', async () => {
      const response = await http()
        .post('/ingredient-categories')
        .set(...authHeader())
        .send({ id: 'not-a-uuid', name: 'x' })

      expect(response.status).toBe(400)
      expect(Array.isArray(response.body.message)).toBe(true)
      expect(response.body.message.length).toBeGreaterThan(0)
    })
  })

  describe('GET /ingredient-categories/:id', () => {
    it('returns the previously created category', async () => {
      const id = UuidMother.random()

      await http()
        .post('/ingredient-categories')
        .set(...authHeader())
        .send({ id, name: 'Postres', description: 'Dulces', isActive: true })
        .expect(201)

      const response = await http()
        .get(`/ingredient-categories/${id}`)
        .set(...authHeader())

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        id,
        name: 'Postres',
        description: 'Dulces',
        isActive: true
      })
    })
  })

  describe('GET /ingredient-categories', () => {
    it('returns a paginated envelope containing the created row', async () => {
      const id = UuidMother.random()

      await http()
        .post('/ingredient-categories')
        .set(...authHeader())
        .send({ id, name: 'Entradas', isActive: true })
        .expect(201)

      const response = await http()
        .get('/ingredient-categories')
        .query({ page: 1, pageSize: 10 })
        .set(...authHeader())

      expect(response.status).toBe(200)
      expect(response.body.meta).toMatchObject({ page: 1, pageSize: 10 })
      expect(response.body.data.some((item: { id: string }) => item.id === id)).toBe(true)
    })
  })
})

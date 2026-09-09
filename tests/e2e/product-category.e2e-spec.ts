import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { resetDatabase } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * HTTP-boundary e2e spec for the `product-category` module (design "Phase 1:
 * E2E Regression Net", spec requirement "Product-Category e2e HTTP-Boundary
 * Coverage"). Mirrors `ingredient-category.e2e-spec.ts` / `recipe.e2e-spec.ts`
 * — real HTTP request via supertest -> ProductCategoriesController -> direct
 * `.run()` calls -> real Postgres (Testcontainers).
 *
 * Written and merged GREEN against the pre-migration CQRS-wired code
 * (design D5), then kept passing UNMODIFIED through Phase 2 (product +
 * product-category migration), which is what this spec now documents.
 */
describe('ProductCategoriesController (e2e)', () => {
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

  function createCategoryPayload(): Record<string, unknown> {
    const id = UuidMother.random()
    return {
      id,
      name: `Categoria ${id.slice(0, 8)}`,
      description: 'Descripcion de prueba',
      icon: 'burger',
      color: '#FF5733',
      isActive: true,
      displayOrder: 3
    }
  }

  describe('POST /product-categories', () => {
    it('rejects an unauthenticated request with 401, proving JwtAuthGuard is wired', async () => {
      const body = createCategoryPayload()

      const response = await http().post('/product-categories').send(body)

      expect(response.status).toBe(401)
    })

    it('creates the category and persists it with the client-supplied id', async () => {
      const body = createCategoryPayload()

      const response = await http()
        .post('/product-categories')
        .set(...(await authHeader()))
        .send(body)

      expect(response.status).toBe(201)

      const rows = await dataSource.query('SELECT * FROM product_categories WHERE id = $1', [
        body.id
      ])

      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe(body.name)
      expect(rows[0].description).toBe(body.description)
      expect(rows[0].icon).toBe(body.icon)
      expect(rows[0].color).toBe(body.color)
      expect(rows[0].is_active).toBe(true)
      expect(rows[0].display_order).toBe(body.displayOrder)
    })

    it('rejects an invalid body with 400 and class-validator messages, proving ValidationPipe is wired', async () => {
      const response = await http()
        .post('/product-categories')
        .set(...(await authHeader()))
        .send({ id: 'not-a-uuid' })

      expect(response.status).toBe(400)
      expect(Array.isArray(response.body.message)).toBe(true)
      expect(response.body.message.length).toBeGreaterThan(0)

      const rows = await dataSource.query('SELECT * FROM product_categories')
      expect(rows).toHaveLength(0)
    })
  })

  describe('GET /product-categories/:id', () => {
    it('returns the previously created category with the expected shape', async () => {
      const body = createCategoryPayload()

      await http()
        .post('/product-categories')
        .set(...(await authHeader()))
        .send(body)
        .expect(201)

      const response = await http()
        .get(`/product-categories/${body.id}`)
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        id: body.id,
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        isActive: true,
        displayOrder: body.displayOrder
      })
    })

    it('rejects an unauthenticated request with 401', async () => {
      const response = await http().get(`/product-categories/${UuidMother.random()}`)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /product-categories', () => {
    it('returns a paginated envelope containing the created row', async () => {
      const body = createCategoryPayload()

      await http()
        .post('/product-categories')
        .set(...(await authHeader()))
        .send(body)
        .expect(201)

      const response = await http()
        .get('/product-categories')
        .query({ page: 1, pageSize: 10 })
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(response.body.meta).toMatchObject({ page: 1, pageSize: 10 })
      expect(response.body.data.some((item: { id: string }) => item.id === body.id)).toBe(true)
    })

    it('rejects an unauthenticated request with 401', async () => {
      const response = await http().get('/product-categories')

      expect(response.status).toBe(401)
    })
  })

  describe('PUT /product-categories/:id', () => {
    it('updates the category and returns 200 (not 204), persisting the change', async () => {
      const body = createCategoryPayload()

      await http()
        .post('/product-categories')
        .set(...(await authHeader()))
        .send(body)
        .expect(201)

      const updateResponse = await http()
        .put(`/product-categories/${body.id}`)
        .set(...(await authHeader()))
        .send({
          name: 'Categoria actualizada',
          description: 'Descripcion actualizada',
          icon: 'pizza',
          color: '#00FF00',
          isActive: false,
          displayOrder: 7
        })

      expect(updateResponse.status).toBe(200)

      const rows = await dataSource.query('SELECT * FROM product_categories WHERE id = $1', [
        body.id
      ])

      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe('Categoria actualizada')
      expect(rows[0].description).toBe('Descripcion actualizada')
      expect(rows[0].icon).toBe('pizza')
      expect(rows[0].color).toBe('#00FF00')
      expect(rows[0].is_active).toBe(false)
      expect(rows[0].display_order).toBe(7)
    })
  })

  describe('DELETE /product-categories/:id', () => {
    it('deletes the category so it can no longer be retrieved', async () => {
      const body = createCategoryPayload()

      await http()
        .post('/product-categories')
        .set(...(await authHeader()))
        .send(body)
        .expect(201)

      const deleteResponse = await http()
        .delete(`/product-categories/${body.id}`)
        .set(...(await authHeader()))

      expect(deleteResponse.status).toBe(204)

      const rows = await dataSource.query('SELECT * FROM product_categories WHERE id = $1', [
        body.id
      ])
      expect(rows).toHaveLength(0)
    })
  })
})

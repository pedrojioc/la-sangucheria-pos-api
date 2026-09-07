import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { resetDatabase } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * HTTP-boundary spec for the `ingredient` module (design "New e2e — ingredient",
 * spec requirement "Ingredient e2e HTTP-Boundary Coverage"). Mirrors
 * `ingredient-category.e2e-spec.ts` — real HTTP request via supertest ->
 * IngredientController -> use cases (direct `.run()` calls, no CQRS bus) ->
 * real Postgres (Testcontainers), through the global JwtAuthGuard and
 * ValidationPipe wired by configureE2eApp().
 *
 * `create` is wrapped in `@UseInterceptors(TransactionInterceptor)`; this spec
 * exercises the endpoint but the interceptor metadata itself is already
 * pinned by `ingredient.controller.transaction-interceptor.spec.ts` (unit
 * layer), so no dedicated e2e assertion is added for that here.
 */
describe('IngredientController (e2e)', () => {
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

  async function seedCategory(): Promise<string> {
    const id = UuidMother.random()
    await http()
      .post('/ingredient-categories')
      .set(...(await authHeader()))
      .send({ id, name: `Categoria ${id.slice(0, 8)}`, isActive: true })
      .expect(201)
    return id
  }

  async function seedUnit(): Promise<string> {
    const id = UuidMother.random()
    await dataSource.query(
      `INSERT INTO units (id, name, symbol, type, is_active) VALUES ($1, $2, $3, 'weight', true)`,
      [id, `unit-${id.slice(0, 8)}`, 'kgt']
    )
    return id
  }

  describe('POST /ingredients', () => {
    it('rejects an unauthenticated request with 401, proving JwtAuthGuard is wired', async () => {
      const response = await http()
        .post('/ingredients')
        .send({ id: UuidMother.random(), name: 'Tomate', isPerishable: true, isActive: true })

      expect(response.status).toBe(401)
    })

    it('creates the ingredient and persists it with the client-supplied id', async () => {
      const categoryId = await seedCategory()
      const unitId = await seedUnit()
      const id = UuidMother.random()

      const response = await http()
        .post('/ingredients')
        .set(...(await authHeader()))
        .send({
          id,
          name: 'Tomate',
          ingredientCategoryId: categoryId,
          unitId,
          isPerishable: true,
          isActive: true
        })

      expect(response.status).toBe(201)

      const rows = await dataSource.query('SELECT * FROM ingredients WHERE id = $1', [id])

      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe('Tomate')
      expect(rows[0].ingredient_category_id).toBe(categoryId)
      expect(rows[0].unit_id).toBe(unitId)
    })

    it('rejects an invalid body with 400 and class-validator messages, proving ValidationPipe is wired', async () => {
      const response = await http()
        .post('/ingredients')
        .set(...(await authHeader()))
        .send({ id: 'not-a-uuid', name: 'x' })

      expect(response.status).toBe(400)
      expect(Array.isArray(response.body.message)).toBe(true)
      expect(response.body.message.length).toBeGreaterThan(0)
    })
  })

  describe('GET /ingredients/:id', () => {
    it('returns the previously created ingredient', async () => {
      const categoryId = await seedCategory()
      const unitId = await seedUnit()
      const id = UuidMother.random()

      await http()
        .post('/ingredients')
        .set(...(await authHeader()))
        .send({
          id,
          name: 'Cebolla',
          ingredientCategoryId: categoryId,
          unitId,
          isPerishable: true,
          isActive: true
        })
        .expect(201)

      const response = await http()
        .get(`/ingredients/${id}`)
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        id,
        name: 'Cebolla',
        categoryId,
        baseUnit: unitId,
        isPerishable: true,
        isActive: true
      })
    })
  })

  describe('PUT /ingredients/:id', () => {
    it('updates the ingredient and persists the new values', async () => {
      const categoryId = await seedCategory()
      const unitId = await seedUnit()
      const id = UuidMother.random()

      await http()
        .post('/ingredients')
        .set(...(await authHeader()))
        .send({
          id,
          name: 'Cilantro',
          ingredientCategoryId: categoryId,
          unitId,
          isPerishable: true,
          isActive: true
        })
        .expect(201)

      const response = await http()
        .put(`/ingredients/${id}`)
        .set(...(await authHeader()))
        .send({
          name: 'Cilantro Fresco',
          ingredientCategoryId: categoryId,
          unitId,
          isPerishable: false,
          isActive: true
        })

      expect(response.status).toBe(200)

      const rows = await dataSource.query('SELECT * FROM ingredients WHERE id = $1', [id])
      expect(rows[0].name).toBe('Cilantro Fresco')
      expect(rows[0].is_perishable).toBe(false)
    })
  })

  describe('GET /ingredients', () => {
    it('returns a paginated envelope containing the created row', async () => {
      const categoryId = await seedCategory()
      const unitId = await seedUnit()
      const id = UuidMother.random()

      await http()
        .post('/ingredients')
        .set(...(await authHeader()))
        .send({
          id,
          name: 'Limón',
          ingredientCategoryId: categoryId,
          unitId,
          isPerishable: true,
          isActive: true
        })
        .expect(201)

      const response = await http()
        .get('/ingredients')
        .query({ page: 1, pageSize: 10 })
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(response.body.meta).toMatchObject({ page: 1, pageSize: 10 })
      expect(response.body.data.some((item: { id: string }) => item.id === id)).toBe(true)
    })
  })
})

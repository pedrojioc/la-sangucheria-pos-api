import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { resetDatabase } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * HTTP-boundary e2e spec for the `preparation-recipe` module (design "Phase
 * 1: E2E Regression Net", spec requirement "Preparation-Recipe e2e
 * HTTP-Boundary Coverage"). Covers only `create` and `search` — the two
 * `PreparationRecipeController` methods being migrated off CQRS in Phase 3;
 * `update`/`findOne` already call `.run()` directly and stay out of scope
 * (design D-file-changes table).
 *
 * Written and merged GREEN against the pre-migration CQRS-wired code
 * (design D5) — this is the regression net Phase 3 (transformation
 * migration) must keep passing UNMODIFIED.
 *
 * `search`'s pagination envelope guard (D4): the controller reconstructs
 * `new PaginatedPreparationRecipeListResponse(data, result.meta)` — a flat
 * 2-arg shape, unlike inventory's nested `{ paginated, stats }`. This spec
 * asserts BOTH `data` and `meta` keys explicitly.
 */
describe('PreparationRecipeController (e2e)', () => {
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

  async function seedIngredient(unitId: string, categoryId: string): Promise<string> {
    const ingredientId = UuidMother.random()

    await http()
      .post('/ingredients')
      .set(...(await authHeader()))
      .send({
        id: ingredientId,
        name: `Ingrediente ${ingredientId.slice(0, 8)}`,
        ingredientCategoryId: categoryId,
        unitId,
        isPerishable: true,
        isActive: true
      })
      .expect(201)

    return ingredientId
  }

  /**
   * Seeds a base ingredient and an output ingredient — both required by
   * `CreatePreparationRecipe`, which resolves `baseIngredientId`/
   * `outputIngredientId` and FK-constrains `preparation_recipes` against
   * `ingredients`.
   */
  async function seedIngredients(): Promise<{
    baseIngredientId: string
    outputIngredientId: string
  }> {
    const categoryId = await seedCategory()
    const unitId = await seedUnit()
    const baseIngredientId = await seedIngredient(unitId, categoryId)
    const outputIngredientId = await seedIngredient(unitId, categoryId)

    return { baseIngredientId, outputIngredientId }
  }

  async function createPayload(): Promise<{ id: string; body: Record<string, unknown> }> {
    const { baseIngredientId, outputIngredientId } = await seedIngredients()
    const id = UuidMother.random()

    return {
      id,
      body: {
        id,
        name: `Preparacion ${id.slice(0, 8)}`,
        baseIngredientId,
        outputIngredientId,
        yieldPercentage: 50,
        additionalIngredients: [],
        description: 'Preparacion de prueba'
      }
    }
  }

  describe('POST /preparation-recipes', () => {
    it('rejects an unauthenticated request with 401, proving JwtAuthGuard is wired', async () => {
      const { body } = await createPayload()

      const response = await http().post('/preparation-recipes').send(body)

      expect(response.status).toBe(401)
    })

    it('creates the preparation recipe and persists it with the client-supplied id', async () => {
      const { id, body } = await createPayload()

      const response = await http()
        .post('/preparation-recipes')
        .set(...(await authHeader()))
        .send(body)

      expect(response.status).toBe(201)

      const rows = await dataSource.query('SELECT * FROM preparation_recipes WHERE id = $1', [id])
      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe(body.name)
      expect(rows[0].base_ingredient_id).toBe(body.baseIngredientId)
      expect(rows[0].output_ingredient_id).toBe(body.outputIngredientId)
    })

    it('rejects a body missing required fields with 400, proving ValidationPipe is wired', async () => {
      const response = await http()
        .post('/preparation-recipes')
        .set(...(await authHeader()))
        .send({ id: UuidMother.random() })

      expect(response.status).toBe(400)
      expect(Array.isArray(response.body.message)).toBe(true)
      expect(response.body.message.length).toBeGreaterThan(0)

      const rows = await dataSource.query('SELECT * FROM preparation_recipes')
      expect(rows).toHaveLength(0)
    })
  })

  describe('GET /preparation-recipes', () => {
    it('rejects an unauthenticated request with 401', async () => {
      const response = await http().get('/preparation-recipes')

      expect(response.status).toBe(401)
    })

    it('returns a paginated envelope with both data and meta containing the created record', async () => {
      const { id, body } = await createPayload()

      await http()
        .post('/preparation-recipes')
        .set(...(await authHeader()))
        .send(body)
        .expect(201)

      const response = await http()
        .get('/preparation-recipes')
        .query({ page: 1, pageSize: 10 })
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      // D4 pagination-envelope regression guard: both keys must be present.
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('meta')
      expect(response.body.meta).toMatchObject({ page: 1, pageSize: 10 })
      expect(response.body.data.some((item: { id: string }) => item.id === id)).toBe(true)
    })
  })
})

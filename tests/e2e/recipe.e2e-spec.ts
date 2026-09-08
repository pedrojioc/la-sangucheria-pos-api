import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { resetDatabase } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * HTTP-boundary e2e spec for the `recipe` module (design "Phase 1: E2E
 * Regression Net", spec requirement "Recipe e2e HTTP-Boundary Coverage").
 * Mirrors `ingredient-category.e2e-spec.ts` — real HTTP request via supertest
 * -> RecipeController -> CommandBus/QueryBus (current CQRS wiring) -> real
 * Postgres (Testcontainers).
 *
 * Written and merged GREEN against the pre-migration CQRS-wired code
 * (design D5) — this is the regression net Phase 2 (recipe migration) must
 * keep passing UNMODIFIED.
 *
 * `recipe_items.ingredient_id` / `unit_id` are FK-constrained (RESTRICT), so
 * fixtures seed a real ingredient + unit via the same
 * `seedCategory()` -> `seedUnit()` -> `POST /ingredients` chain used by
 * `inventory-level.e2e-spec.ts`, copied locally (file-local closure
 * convention in this codebase).
 */
describe('RecipeController (e2e)', () => {
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

  async function seedIngredient(): Promise<{ ingredientId: string; unitId: string }> {
    const categoryId = await seedCategory()
    const unitId = await seedUnit()
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

    return { ingredientId, unitId }
  }

  async function createRecipePayload(): Promise<{
    id: string
    ingredientId: string
    unitId: string
    body: Record<string, unknown>
  }> {
    const { ingredientId, unitId } = await seedIngredient()
    const id = UuidMother.random()

    return {
      id,
      ingredientId,
      unitId,
      body: {
        id,
        name: `Receta ${id.slice(0, 8)}`,
        description: 'Receta de prueba',
        items: [{ ingredientId, quantity: 2, unitId }],
        recipeYield: { value: 1, unitId, description: 'Porcion base' }
      }
    }
  }

  describe('POST /recipes', () => {
    it('rejects an unauthenticated request with 401, proving JwtAuthGuard is wired', async () => {
      const { body } = await createRecipePayload()

      const response = await http().post('/recipes').send(body)

      expect(response.status).toBe(401)
    })

    it('creates the recipe and persists it with the client-supplied id', async () => {
      const { id, ingredientId, unitId, body } = await createRecipePayload()

      const response = await http()
        .post('/recipes')
        .set(...(await authHeader()))
        .send(body)

      expect(response.status).toBe(201)

      const rows = await dataSource.query('SELECT * FROM recipes WHERE id = $1', [id])
      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe(body.name)
      expect(rows[0].yield_unit_id).toBe(unitId)

      const itemRows = await dataSource.query('SELECT * FROM recipe_items WHERE recipe_id = $1', [
        id
      ])
      expect(itemRows).toHaveLength(1)
      expect(itemRows[0].ingredient_id).toBe(ingredientId)
    })

    it('rejects a body missing required fields with 400, proving ValidationPipe is wired', async () => {
      const response = await http()
        .post('/recipes')
        .set(...(await authHeader()))
        .send({ id: UuidMother.random() })

      expect(response.status).toBe(400)
      expect(Array.isArray(response.body.message)).toBe(true)
      expect(response.body.message.length).toBeGreaterThan(0)

      const rows = await dataSource.query('SELECT * FROM recipes')
      expect(rows).toHaveLength(0)
    })
  })

  describe('GET /recipes/:id', () => {
    it('returns the previously created recipe with the expected shape', async () => {
      const { id, ingredientId, unitId, body } = await createRecipePayload()

      await http()
        .post('/recipes')
        .set(...(await authHeader()))
        .send(body)
        .expect(201)

      const response = await http()
        .get(`/recipes/${id}`)
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        id,
        name: body.name,
        description: body.description,
        items: [{ ingredientId, quantity: 2, unitId }],
        recipeYield: { value: 1, unitId, description: 'Porcion base' },
        isActive: true
      })
    })

    it('rejects an unauthenticated request with 401', async () => {
      const response = await http().get(`/recipes/${UuidMother.random()}`)

      expect(response.status).toBe(401)
    })
  })

  describe('GET /recipes', () => {
    it('returns an array containing the created recipe', async () => {
      const { id, body } = await createRecipePayload()

      await http()
        .post('/recipes')
        .set(...(await authHeader()))
        .send(body)
        .expect(201)

      const response = await http()
        .get('/recipes')
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body)).toBe(true)
      expect(response.body.some((recipe: { id: string }) => recipe.id === id)).toBe(true)
    })
  })

  describe('PUT /recipes/:id', () => {
    it('updates the recipe and persists the change', async () => {
      const { id, ingredientId, unitId, body } = await createRecipePayload()

      await http()
        .post('/recipes')
        .set(...(await authHeader()))
        .send(body)
        .expect(201)

      const updateResponse = await http()
        .put(`/recipes/${id}`)
        .set(...(await authHeader()))
        .send({
          name: 'Receta actualizada',
          description: 'Descripcion actualizada',
          items: [{ ingredientId, quantity: 5, unitId }],
          recipeYield: { value: 2, unitId, description: 'Porcion actualizada' }
        })

      expect(updateResponse.status).toBe(204)

      const getResponse = await http()
        .get(`/recipes/${id}`)
        .set(...(await authHeader()))

      expect(getResponse.body).toMatchObject({
        name: 'Receta actualizada',
        description: 'Descripcion actualizada',
        items: [{ ingredientId, quantity: 5, unitId }],
        recipeYield: { value: 2, unitId, description: 'Porcion actualizada' }
      })
    })
  })

  describe('DELETE /recipes/:id', () => {
    it('deletes the recipe so it can no longer be retrieved', async () => {
      const { id, body } = await createRecipePayload()

      await http()
        .post('/recipes')
        .set(...(await authHeader()))
        .send(body)
        .expect(201)

      const deleteResponse = await http()
        .delete(`/recipes/${id}`)
        .set(...(await authHeader()))

      expect(deleteResponse.status).toBe(204)

      const rows = await dataSource.query('SELECT * FROM recipes WHERE id = $1', [id])
      expect(rows).toHaveLength(0)
    })
  })
})

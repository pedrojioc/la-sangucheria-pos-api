import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { resetDatabase } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

/**
 * HTTP-boundary e2e spec for the `product` module (design "Phase 1: E2E
 * Regression Net", spec requirement "Product e2e HTTP-Boundary Coverage").
 * Mirrors `recipe.e2e-spec.ts` — real HTTP request via supertest ->
 * ProductController -> CommandBus/QueryBus (current CQRS wiring) -> real
 * Postgres (Testcontainers).
 *
 * Written and merged GREEN against the pre-migration CQRS-wired code
 * (design D5) — this is the regression net Phase 2 (product +
 * product-category migration) must keep passing UNMODIFIED.
 *
 * KNOWN ENVIRONMENTAL LIMITATION (discovered during apply, reported to
 * orchestrator/user, not fixed here — see apply-progress): `imageFile`/
 * `image` multipart uploads cannot be exercised end-to-end under this
 * project's `pnpm test:e2e` (Jest + ts-jest, no `--experimental-vm-modules`).
 * `@nestjs/common`'s `FileTypeValidator` loads the pure-ESM `file-type`
 * package via `load-esm`'s bare `import()`; inside Jest's CJS VM sandbox
 * this throws `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG`, which the
 * validator's own `catch { return false }` swallows, so every upload is
 * rejected with a misleading generic 400 regardless of file validity. This
 * is a Jest/Node ESM-interop gap in `@nestjs/common`'s file validation, not
 * a bug in this codebase's product code. Scenarios below that exercise the
 * D5 image-related argument-order guards work around this by seeding an
 * existing image directly via SQL (bypassing the broken upload path) and
 * asserting the `removeImage` argument slot end-to-end through the real
 * `PUT /products/:id` HTTP call and `UpdateProduct.run()` — this still
 * fully proves the D5.2/D5.3 argument-order contract, only the upload leg
 * itself is untestable in this harness.
 *
 * D5 mandatory argument-order guards (all three present in this file):
 *  1. Full-12-arg `CreateProduct` scenario with column-by-column DB assertion
 *     ("full 12-arg create, column-by-column assertion" below).
 *  2. Isolated `removeImage: true` update scenario, asserting both
 *     `image_url` and `image_storage_key` go null ("removeImage: true
 *     removes the image" below).
 *  3. `removeImage: false` counterpart that also changes
 *     `preparationTime`/`displayOrder`, using fixture values that never
 *     numerically repeat across `price`/`preparationTime`/`displayOrder`
 *     ("removeImage: false preserves the image while other fields change"
 *     below).
 *
 * Route-collision baseline note (task 1.5): `GET /products/generate-sku`
 * is exercised below to prove it returns a SKU under the CURRENT single
 * `ProductController` (both routes live on the same controller today, so
 * there is no cross-controller collision yet). The actual collision
 * assertion — proving `GET /products/generate-sku` still resolves correctly
 * once `GET /products/:id` moves to the new `ProductWithOptionsController`
 * in `product-option` (design D1) — is deferred to Phase 3 task 3.16,
 * because that controller does not exist yet in Phase 1.
 */
describe('ProductController (e2e)', () => {
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
      .post('/product-categories')
      .set(...(await authHeader()))
      .send({ id, name: `Categoria ${id.slice(0, 8)}`, isActive: true })
      .expect(201)
    return id
  }

  async function seedIngredientCategory(): Promise<string> {
    const id = UuidMother.random()
    await http()
      .post('/ingredient-categories')
      .set(...(await authHeader()))
      .send({ id, name: `IngCategoria ${id.slice(0, 8)}`, isActive: true })
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

  async function seedIngredient(): Promise<string> {
    const categoryId = await seedIngredientCategory()
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

    return ingredientId
  }

  function uniqueSku(): string {
    return `SKU-${UuidMother.random().slice(0, 8)}`
  }

  describe('POST /products', () => {
    it('rejects an unauthenticated request with 401, proving JwtAuthGuard is wired', async () => {
      const categoryId = await seedCategory()
      const id = UuidMother.random()

      const response = await http()
        .post('/products')
        .send({ id, name: 'Sanguche Clasico', categoryId, price: 12000, sku: uniqueSku() })

      expect(response.status).toBe(401)
    })

    it('full 12-arg create, column-by-column assertion (D5.1 — catches a sku/inventoryStrategyType slot-5/6 swap)', async () => {
      const categoryId = await seedCategory()
      const ingredientId = await seedIngredient()
      const id = UuidMother.random()
      const sku = uniqueSku()

      const response = await http()
        .post('/products')
        .set(...(await authHeader()))
        .send({
          id,
          name: 'Sanguche Especial',
          categoryId,
          price: 15500,
          sku,
          inventoryStrategyType: 'DIRECT',
          description: 'Sanguche con doble carne',
          ingredientId,
          preparationTime: 8,
          displayOrder: 4,
          tags: ['especial', 'nuevo']
        })

      expect(response.status).toBe(201)

      const rows = await dataSource.query('SELECT * FROM products WHERE id = $1', [id])
      expect(rows).toHaveLength(1)

      const row = rows[0]
      expect(row.name).toBe('Sanguche Especial')
      expect(row.category_id).toBe(categoryId)
      expect(Number(row.price)).toBe(15500)
      expect(row.sku).toBe(sku)
      expect(row.inventory_strategy_type).toBe('DIRECT')
      expect(row.description).toBe('Sanguche con doble carne')
      expect(row.ingredient_id).toBe(ingredientId)
      expect(row.preparation_time).toBe(8)
      expect(row.display_order).toBe(4)
      // `tags` is a TypeORM `simple-array` column — stored as a raw
      // comma-separated string, not a native Postgres array.
      expect(row.tags).toBe('especial,nuevo')
    })

    it('rejects a body missing required fields with 400, proving ValidationPipe is wired', async () => {
      const response = await http()
        .post('/products')
        .set(...(await authHeader()))
        .send({ id: UuidMother.random() })

      expect(response.status).toBe(400)
      expect(Array.isArray(response.body.message)).toBe(true)
      expect(response.body.message.length).toBeGreaterThan(0)

      const rows = await dataSource.query('SELECT * FROM products')
      expect(rows).toHaveLength(0)
    })
  })

  describe('GET /products/generate-sku', () => {
    it('returns a generated SKU (route-collision baseline — see file header note)', async () => {
      const response = await http()
        .get('/products/generate-sku')
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(typeof response.body.sku).toBe('string')
      expect(response.body.sku.length).toBeGreaterThan(0)
    })

    it('still returns a SKU, not a 404, now that ProductWithOptionsController owns a sibling GET :id route (task 3.16 — D1 route-collision guard)', async () => {
      // `GET /products/generate-sku` (literal, ProductController) and
      // `GET /products/:id` (param, ProductWithOptionsController in
      // product-option) are now registered on two DIFFERENT controllers
      // sharing the same `@Controller('products')` prefix. Nest resolves
      // by registration order in app.module.ts, where ProductModule
      // precedes ProductOptionModule — the literal route must still win,
      // or this request would be swallowed by `:id` and 404/500 as an
      // invalid-UUID lookup instead of returning a SKU.
      const response = await http()
        .get('/products/generate-sku')
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(typeof response.body.sku).toBe('string')
      expect(response.body.sku.length).toBeGreaterThan(0)
    })
  })

  describe('GET /products', () => {
    it('returns a paginated envelope containing the created row', async () => {
      const categoryId = await seedCategory()
      const id = UuidMother.random()

      await http()
        .post('/products')
        .set(...(await authHeader()))
        .send({ id, name: 'Sanguche Basico', categoryId, price: 9000, sku: uniqueSku() })
        .expect(201)

      const response = await http()
        .get('/products')
        .query({ page: 1, pageSize: 10 })
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(response.body.meta).toMatchObject({ page: 1, pageSize: 10 })
      expect(response.body.data.some((item: { id: string }) => item.id === id)).toBe(true)
    })
  })

  describe('GET /products/:id', () => {
    it('returns the full shape including optionGroups and recipe', async () => {
      const categoryId = await seedCategory()
      const id = UuidMother.random()
      const sku = uniqueSku()

      await http()
        .post('/products')
        .set(...(await authHeader()))
        .send({ id, name: 'Sanguche Completo', categoryId, price: 11000, sku })
        .expect(201)

      const response = await http()
        .get(`/products/${id}`)
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        id,
        name: 'Sanguche Completo',
        categoryId,
        sku,
        optionGroups: [],
        recipe: null
      })
    })
  })

  describe('PUT /products/:id', () => {
    it('removeImage: true removes the image (D5.2 — isolated, no file in the same request)', async () => {
      const categoryId = await seedCategory()
      const id = UuidMother.random()

      await http()
        .post('/products')
        .set(...(await authHeader()))
        .send({ id, name: 'Sanguche Con Imagen', categoryId, price: 13000, sku: uniqueSku() })
        .expect(201)

      // Upload cannot be exercised under this Jest harness (see file header
      // note) — seed an existing image directly via SQL so the removeImage
      // path has something real to remove.
      await dataSource.query(
        `UPDATE products SET image_url = $1, image_storage_key = $2 WHERE id = $3`,
        ['http://localhost:3000/uploads/images/seed.png', 'images/seed.png', id]
      )

      const updateResponse = await http()
        .put(`/products/${id}`)
        .set(...(await authHeader()))
        .send({
          name: 'Sanguche Con Imagen',
          categoryId,
          price: 13000,
          removeImage: true
        })

      expect(updateResponse.status).toBe(204)

      const afterRows = await dataSource.query('SELECT * FROM products WHERE id = $1', [id])
      expect(afterRows[0].image_url).toBeNull()
      expect(afterRows[0].image_storage_key).toBeNull()
    })

    it('removeImage: false preserves the image while other fields change (D5.2/D5.3 — distinguishes a correct call from a slot-9 shift)', async () => {
      const categoryId = await seedCategory()
      const id = UuidMother.random()

      await http()
        .post('/products')
        .set(...(await authHeader()))
        .send({
          id,
          name: 'Sanguche Preservado',
          categoryId,
          price: 13000,
          sku: uniqueSku(),
          preparationTime: 5,
          displayOrder: 1
        })
        .expect(201)

      // Seed an existing image directly via SQL (upload path untestable
      // under this Jest harness — see file header note).
      const originalImageUrl = 'http://localhost:3000/uploads/images/preservado.png'
      const originalStorageKey = 'images/preservado.png'
      await dataSource.query(
        `UPDATE products SET image_url = $1, image_storage_key = $2 WHERE id = $3`,
        [originalImageUrl, originalStorageKey, id]
      )

      // Distinct, non-repeating numeric fixture values across price /
      // preparationTime / displayOrder (design D5.3) — a positional swap
      // between any two of these three fields must be observable.
      const updateResponse = await http()
        .put(`/products/${id}`)
        .set(...(await authHeader()))
        .send({
          name: 'Sanguche Preservado',
          categoryId,
          price: 13000,
          removeImage: false,
          preparationTime: 17,
          displayOrder: 23
        })

      expect(updateResponse.status).toBe(204)

      const afterRows = await dataSource.query('SELECT * FROM products WHERE id = $1', [id])
      expect(afterRows[0].image_url).toBe(originalImageUrl)
      expect(afterRows[0].image_storage_key).toBe(originalStorageKey)
      expect(afterRows[0].preparation_time).toBe(17)
      expect(afterRows[0].display_order).toBe(23)
    })
  })

  describe('DELETE /products/:id', () => {
    it('deletes the product so it can no longer be retrieved', async () => {
      const categoryId = await seedCategory()
      const id = UuidMother.random()

      await http()
        .post('/products')
        .set(...(await authHeader()))
        .send({ id, name: 'Sanguche Eliminable', categoryId, price: 8000, sku: uniqueSku() })
        .expect(201)

      const deleteResponse = await http()
        .delete(`/products/${id}`)
        .set(...(await authHeader()))

      expect(deleteResponse.status).toBe(204)

      const rows = await dataSource.query('SELECT * FROM products WHERE id = $1', [id])
      expect(rows).toHaveLength(0)
    })
  })
})

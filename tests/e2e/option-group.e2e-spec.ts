import { INestApplication } from '@nestjs/common'
import { DataSource } from 'typeorm'

import { bootstrapE2eApp, E2eContext } from './support/bootstrap-e2e-app'
import { resetDatabase } from './support/truncate'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

import { TypeOrmOptionGroupRepository } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/typeorm-option-group.repository'
import { OptionGroupEntity } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/option-group.entity'
import { OptionItemEntity } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/option-item.entity'
import { ProductOptionGroupEntity } from '@contexts/menu/product-option/infrastructure/persistence/typeorm/product-option-group.entity'
import { OptionGroup } from '@contexts/menu/product-option/domain/option-group'
import { OptionItem } from '@contexts/menu/product-option/domain/option-item'
import { UnitOfWorkContextHolder } from '@shared/infrastructure/unit-of-work/unit-of-work-context-holder'
import { UnitOfWorkContext } from '@shared/infrastructure/unit-of-work/unit-of-work-context'

/**
 * HTTP-boundary e2e spec for the `product-option` (`option-group`) module
 * (design "Phase 1: E2E Regression Net", spec requirement "Option-Group e2e
 * HTTP-Boundary Coverage"). Mirrors `recipe.e2e-spec.ts` — real HTTP request
 * via supertest -> OptionGroupController -> direct `.run()` calls -> real
 * Postgres (Testcontainers).
 *
 * Written and merged GREEN against the pre-migration CQRS-wired code
 * (design D5), then kept passing UNMODIFIED through Phase 3 (product-option
 * migration + atomicity fix), which is what this spec now documents.
 *
 * `option_items.ingredient_id` / `unit_id` are FK-constrained (RESTRICT), so
 * fixtures seed a real ingredient + unit via the same
 * `seedCategory()` -> `seedUnit()` -> `POST /ingredients` chain used by
 * `recipe.e2e-spec.ts`, copied locally (file-local closure convention in
 * this codebase).
 *
 * The "multiple option-items, full replacement on update" scenario below
 * doubles as the atomicity-fix regression guard once Phase 3 adds
 * `TransactionInterceptor` to `TypeOrmOptionGroupRepository` — the
 * pre-existing bug is about un-transacted writes, not incorrect writes, so
 * this passes today (pre-fix) too; it only becomes a *transactional*
 * guarantee once the interceptor lands.
 */
describe('OptionGroupController (e2e)', () => {
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

  async function createOptionGroupPayload(
    itemCount = 1
  ): Promise<{ id: string; unitId: string; items: Array<Record<string, unknown>> }> {
    const { ingredientId, unitId } = await seedIngredient()
    const id = UuidMother.random()

    const items = Array.from({ length: itemCount }, (_, index) => ({
      id: UuidMother.random(),
      label: `Item ${index + 1}`,
      ingredientId,
      quantity: 1,
      unitId,
      extraPrice: 0.5 + index,
      sortOrder: index
    }))

    return { id, unitId, items }
  }

  describe('POST /option-groups', () => {
    it('rejects an unauthenticated request with 401, proving JwtAuthGuard is wired', async () => {
      const { id, items } = await createOptionGroupPayload()

      const response = await http().post('/option-groups').send({
        id,
        name: 'Salsas',
        type: 'ADD',
        required: false,
        minSelections: 0,
        maxSelections: 3,
        items
      })

      expect(response.status).toBe(401)
    })

    it('creates the option group with items, persisting both option_groups and option_items rows', async () => {
      const { id, items } = await createOptionGroupPayload(2)

      const response = await http()
        .post('/option-groups')
        .set(...(await authHeader()))
        .send({
          id,
          name: 'Salsas',
          type: 'ADD',
          required: false,
          minSelections: 0,
          maxSelections: 3,
          items
        })

      expect(response.status).toBe(201)

      const groupRows = await dataSource.query('SELECT * FROM option_groups WHERE id = $1', [id])
      expect(groupRows).toHaveLength(1)
      expect(groupRows[0].name).toBe('Salsas')
      expect(groupRows[0].type).toBe('ADD')
      expect(groupRows[0].required).toBe(false)
      expect(groupRows[0].min_selections).toBe(0)
      expect(groupRows[0].max_selections).toBe(3)
      expect(groupRows[0].is_active).toBe(true)

      const itemRows = await dataSource.query(
        'SELECT * FROM option_items WHERE group_id = $1 ORDER BY sort_order ASC',
        [id]
      )
      expect(itemRows).toHaveLength(2)
      expect(itemRows[0].label).toBe(items[0].label)
      expect(itemRows[1].label).toBe(items[1].label)
    })

    it('rejects an invalid body with 400, proving ValidationPipe is wired', async () => {
      const response = await http()
        .post('/option-groups')
        .set(...(await authHeader()))
        .send({ id: 'not-a-uuid' })

      expect(response.status).toBe(400)
      expect(Array.isArray(response.body.message)).toBe(true)
      expect(response.body.message.length).toBeGreaterThan(0)

      const rows = await dataSource.query('SELECT * FROM option_groups')
      expect(rows).toHaveLength(0)
    })
  })

  describe('PUT /option-groups/:id', () => {
    it('replaces the item collection: old items gone, new items present', async () => {
      const { id, unitId, items } = await createOptionGroupPayload(2)

      await http()
        .post('/option-groups')
        .set(...(await authHeader()))
        .send({
          id,
          name: 'Salsas',
          type: 'ADD',
          required: false,
          minSelections: 0,
          maxSelections: 3,
          items
        })
        .expect(201)

      const { ingredientId: newIngredientId } = await seedIngredient()
      const replacementItems = [
        {
          id: UuidMother.random(),
          label: 'Item reemplazo',
          ingredientId: newIngredientId,
          quantity: 2,
          unitId,
          extraPrice: 1.25,
          sortOrder: 0
        }
      ]

      const updateResponse = await http()
        .put(`/option-groups/${id}`)
        .set(...(await authHeader()))
        .send({
          // `UpdateOptionGroupRequest` is a bare alias of
          // `CreateOptionGroupRequest` (`@IsUUID() id` required, not
          // optional) even though the controller ignores the body's `id`
          // and uses `@Param('id')` instead — the field must still be
          // present and a valid UUID for ValidationPipe to accept the body.
          id,
          name: 'Salsas actualizadas',
          type: 'ADD',
          required: true,
          minSelections: 1,
          maxSelections: 1,
          items: replacementItems
        })

      expect(updateResponse.status).toBe(204)

      const oldItemIds = items.map(item => item.id)
      const oldItemRows = await dataSource.query(
        'SELECT * FROM option_items WHERE id = ANY($1::uuid[])',
        [oldItemIds]
      )
      expect(oldItemRows).toHaveLength(0)

      const newItemRows = await dataSource.query('SELECT * FROM option_items WHERE group_id = $1', [
        id
      ])
      expect(newItemRows).toHaveLength(1)
      expect(newItemRows[0].label).toBe('Item reemplazo')
      expect(newItemRows[0].ingredient_id).toBe(newIngredientId)

      const groupRows = await dataSource.query('SELECT * FROM option_groups WHERE id = $1', [id])
      expect(groupRows[0].name).toBe('Salsas actualizadas')
      expect(groupRows[0].required).toBe(true)
    })
  })

  describe('GET /option-groups', () => {
    it('returns a paginated envelope containing the created row', async () => {
      const { id, items } = await createOptionGroupPayload()

      await http()
        .post('/option-groups')
        .set(...(await authHeader()))
        .send({
          id,
          name: 'Salsas',
          type: 'ADD',
          required: false,
          minSelections: 0,
          maxSelections: 3,
          items
        })
        .expect(201)

      const response = await http()
        .get('/option-groups')
        .query({ page: 1, pageSize: 10 })
        .set(...(await authHeader()))

      expect(response.status).toBe(200)
      expect(response.body.meta).toMatchObject({ page: 1, pageSize: 10 })
      expect(response.body.data.some((item: { id: string }) => item.id === id)).toBe(true)
    })

    it('rejects an unauthenticated request with 401', async () => {
      const response = await http().get('/option-groups')

      expect(response.status).toBe(401)
    })
  })

  describe('Atomicity (Phase 3 regression guard for TypeOrmOptionGroupRepository)', () => {
    /**
     * Proves the ADDED spec requirement "Option-Group Persistence Is
     * Transactionally Atomic" (design "Atomicity fix"): `save()` writes the
     * group row then deletes+recreates the item collection, and both parts
     * MUST commit or roll back together once `itemRepository` is ALS-aware
     * and the controller runs under `TransactionInterceptor`.
     *
     * Hand-driven (not HTTP), mirroring
     * `purchase-reception-atomicity.e2e-spec.ts`'s forced-failure pattern:
     * spying through the HTTP boundary would need `overrideProvider`, which
     * is more fragile than directly constructing the repository against the
     * real Testcontainers DataSource and forcing a mid-`save` item failure
     * inside an explicit `dataSource.transaction(...)` + `holder.run(...)`.
     */
    it('rolls back the group row when the item write fails inside the ambient transaction', async () => {
      const dataSourceOptionGroupRepository = dataSource.getRepository(OptionGroupEntity)
      const dataSourceItemRepository = dataSource.getRepository(OptionItemEntity)
      const dataSourcePivotRepository = dataSource.getRepository(ProductOptionGroupEntity)
      const holder = new UnitOfWorkContextHolder()

      const repository = new TypeOrmOptionGroupRepository(
        dataSourceOptionGroupRepository,
        dataSourceItemRepository,
        dataSourcePivotRepository,
        holder
      )

      const { id, items } = await createOptionGroupPayload(1)
      const optionGroup = OptionGroup.create(
        id,
        'Salsas atomicidad',
        'ADD',
        false,
        0,
        3,
        items.map(item =>
          OptionItem.create(
            item.id as string,
            id,
            item.label as string,
            item.ingredientId as string,
            item.quantity as number,
            item.unitId as string,
            item.extraPrice as number,
            item.sortOrder as number,
            true
          )
        )
      )

      await expect(
        dataSource.transaction(manager => {
          const context: UnitOfWorkContext = { manager, pending: [], depth: 0 }

          // Force the item-side write to fail mid-`save()`, scoped to THIS
          // transaction's own EntityManager only — `manager.getRepository`
          // is spied so `itemRepository`'s ALS getter (which calls it) picks
          // up a repository whose `save()` throws, while the group repository
          // resolved by the same call for other targets is untouched.
          const originalGetRepository = manager.getRepository.bind(manager)
          const scopedItemRepository = originalGetRepository(OptionItemEntity)
          jest.spyOn(scopedItemRepository, 'save').mockImplementationOnce((): never => {
            throw new Error('forced option-item save failure')
          })
          jest.spyOn(manager, 'getRepository').mockImplementation((target: unknown) => {
            if (target === OptionItemEntity) {
              return scopedItemRepository
            }
            return originalGetRepository(target as never)
          })

          return holder.run(context, () => repository.save(optionGroup))
        })
      ).rejects.toThrow('forced option-item save failure')

      const groupRows = await dataSource.query('SELECT * FROM option_groups WHERE id = $1', [id])
      expect(groupRows).toHaveLength(0)

      const itemRows = await dataSource.query('SELECT * FROM option_items WHERE group_id = $1', [
        id
      ])
      expect(itemRows).toHaveLength(0)
    })
  })

  describe('DELETE /option-groups/:id (deactivate)', () => {
    it('deactivates the group, keeping items intact', async () => {
      const { id, items } = await createOptionGroupPayload(2)

      await http()
        .post('/option-groups')
        .set(...(await authHeader()))
        .send({
          id,
          name: 'Salsas',
          type: 'ADD',
          required: false,
          minSelections: 0,
          maxSelections: 3,
          items
        })
        .expect(201)

      const deleteResponse = await http()
        .delete(`/option-groups/${id}`)
        .set(...(await authHeader()))

      expect(deleteResponse.status).toBe(204)

      const groupRows = await dataSource.query('SELECT * FROM option_groups WHERE id = $1', [id])
      expect(groupRows).toHaveLength(1)
      expect(groupRows[0].is_active).toBe(false)

      const itemRows = await dataSource.query('SELECT * FROM option_items WHERE group_id = $1', [
        id
      ])
      expect(itemRows).toHaveLength(2)
    })
  })
})

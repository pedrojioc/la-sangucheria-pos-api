import { Test, TestingModule } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeOrmIngredientCategoryRepository } from '@/contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/typeorm-ingredient-category.repository'
import { IngredientCategoryEntity } from '@/contexts/inventory/ingredient-category/infrastructure/persistence/typeorm/ingredient-category.entity'
import { IngredientCategoryId } from '@/contexts/inventory/ingredient-category/domain/ingredient-category-id'
import { IngredientCategoryMother } from '../__mothers__/ingredient-category.mother'
import { UuidMother } from '@test/shared/__mothers__/UuidMother'

describe('TypeOrmIngredientCategoryRepository', () => {
  let repository: TypeOrmIngredientCategoryRepository
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [IngredientCategoryEntity],
          synchronize: true
        }),
        TypeOrmModule.forFeature([IngredientCategoryEntity])
      ],
      providers: [TypeOrmIngredientCategoryRepository]
    }).compile()

    repository = module.get(TypeOrmIngredientCategoryRepository)
  }, 30000)

  afterAll(async () => {
    await module.close()
  })

  describe('save', () => {
    it('should persist and retrieve a full ingredient category', async () => {
      const category = IngredientCategoryMother.carnes()

      await repository.save(category)

      const found = await repository.search(new IngredientCategoryId(category.toPrimitives().id))
      expect(found).not.toBeNull()
      expect(found!.toPrimitives()).toEqual(category.toPrimitives())
    })

    it('should persist a category with null optional fields', async () => {
      const category = IngredientCategoryMother.minimal()

      await repository.save(category)

      const found = await repository.search(new IngredientCategoryId(category.toPrimitives().id))
      expect(found).not.toBeNull()
      const p = found!.toPrimitives()
      expect(p.description).toBeNull()
      expect(p.icon).toBeNull()
      expect(p.color).toBeNull()
      expect(p.sortOrder).toBeNull()
    })
  })

  describe('search', () => {
    it('should return null when category does not exist', async () => {
      const found = await repository.search(new IngredientCategoryId(UuidMother.random()))
      expect(found).toBeNull()
    })
  })

  describe('searchAll', () => {
    it('should return only active categories', async () => {
      const active = IngredientCategoryMother.vegetales()
      const inactive = IngredientCategoryMother.inactive()

      await repository.save(active)
      await repository.save(inactive)

      const results = await repository.searchAll()
      const ids = results.map(c => c.toPrimitives().id)
      expect(ids).toContain(active.toPrimitives().id)
      expect(ids).not.toContain(inactive.toPrimitives().id)
    })
  })
})
